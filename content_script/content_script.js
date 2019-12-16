console.log('content_scritp loaded!');

let globalContacts;
let contactsLimit = 2;
let requestInterval = 0;
let scoreEnable = false;

const fun = {
  requestLimit: 3,
  result: [],

  setState: function({type, param}) {
    if (type === 'start') {

      this.result = [];
      $('#bilin-message').empty();
      $('#bilin-progress  > .bilin-progress').addClass('active');
      $('#bilin-progress  > .bilin-progress-info > .right-info').text(`-- / --`);
      $('#bilin-progress  > .bilin-progress > .bilin-progress-bar').css('width', '0%');
      $('#excel-file').prop('disabled', true);
      $('#score-input').prop('disabled', true);
      $('#startBtn').prop('disabled', true);

    } else if (type === 'complete') {

      $('#bilin-message').empty().append('The search is completed and the file will be downloaded automatically!');
      $('#bilin-progress  > .bilin-progress').removeClass('active');
      $('#score-input').prop('disabled', false);
      $('#excel-file').prop('disabled', false);
      $('#startBtn').prop('disabled', false);

    } else if (type === 'error') {

      $('#bilin-message').empty().append(param);
      $('#score-input').prop('disabled', false);
      $('#excel-file').prop('disabled', false);
      $('#startBtn').prop('disabled', false);

    } else if (type === 'progress') {

      const {current, total} = param;
      const percent = parseInt((current / total * 100), 10) + '%';

      $('#bilin-progress  > .bilin-progress-info > .right-info').text(`${current} / ${total}`);
      $('#bilin-progress  > .bilin-progress > .bilin-progress-bar').css('width', percent);

    }
  },

  changeKey: function(data, keyMap) {
    //const data {id：‘11’,name:‘张三’}
    //const keyMap = {id: ‘序列’, name: ‘姓名’}

    // => {序列：“11”,姓名：“张三” }
    return Object.keys(data).reduce((newData, key) => {
      let newKey = keyMap[key] || key
      newData[newKey] = data[key]
      return newData
    }, {})
  },

  handleGaUserId: function(str) {
    const arr = str.split('.');
    if (arr.length < 2) return '';

    return arr[arr.length - 2] + '.' + arr[arr.length - 1];
  },

  getQuery: function() {
    const gaUserId = localStorage.getItem('gauid');
    if (!gaUserId) return;

    //gaUserId: GA1.2.1106157709.1572830843 => 1106157709.1572830843
    const _ga = docCookies.getItem('_ga');
    if (!_ga) return;

    const gaClientId = this.handleGaUserId(_ga);

    return {
      "gaClientId": gaClientId, // "1106157709.1572830843"
      "gaUserId": gaUserId //"dNCXcfaY"
    };
  },

  getHeader: function() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fingerprint = localStorage.getItem('Seamlessai-fingerprint');
    if (!fingerprint) return;

    return {
      'Authorization': token,
      'Seamlessai-fingerprint': fingerprint,
    };
  },

  queryContacts: async function(data, query, header) {
    const {
      company = '',
      contact = '',
      title = '',
    } = data;

    if (!company) {return;}

    const companyArr =  company.split(',').map(val => val.trim());
    const contactArr =  contact.split(',').map(val => val.trim());
    const titleArr =  title.split(',').map(val => val.trim());
    const params = {
      "url": "https://api.seamless.ai/api/contact/search",
      "type": "POST",
      "header": header,
      "query": query,
      "data": {
        "keywords": [],
        "names": contactArr,
        "titles": titleArr,
        "companies": companyArr,
        "type": "all",
        "fromPeopleSearch": true,
        "page": 0,
        "contactSearchId": null
      }
    }
    console.log('queryContacts params: ',params);

    let counts = 0;
    let searchData;
    do{
      try {
        const { data = {} } = await ufn.ajax(params);
        searchData = data.results;
      } catch (e) {
        console.log('search error: ', e);
      }
      counts += 1;
    }while(counts <= this.requestLimit && !searchData)
    counts = 0;

    console.log('queryContacts results: ', searchData);
    if (!Array.isArray(searchData)) {return [];}

    let res = [];
    // match
    if (contact) {
      for (let i = 0, len = searchData.length; i < len; i++) {
        const current = searchData[i].name.toLowerCase();
        const target = contact.toLowerCase();

        if ((target.indexOf(current) !== -1) || (current.indexOf(target) !== -1)) {
          res.push(searchData[i]);
          break;
        }
      }
    // search
    } else {
      if (scoreEnable) {
        for (let i = 0, len = searchData.length; i < len; i++) {
          // const titles = titleArr // ['ceo', 'president', 'vice president1', 'vice President 1Operations']
          // const title = searchData[i].title; //'Vice President Operations'
          const AnalyzeObj = new AnalyzeTitle(titleArr);
          const { item, score } = AnalyzeObj.title_score(searchData[i].title);

          searchData[i]['titleMatch'] = score;
        }

        searchData.sort((a, b) => (b.titleMatch - a.titleMatch)); // 将title score从大到小排序
      }

      res = searchData.slice(0, contactsLimit); //若search模式，选取前contactsLimit个contact
    }

    return res;
  },

  researchContacts: async function(data, query, header) {
    const keyMap = {
      company: 'companyName',
      name: 'contactName',
    };
    const newData = this.changeKey(data, keyMap);

    const researchParams = {
      "url": "https://api.seamless.ai/api/users/contacts/research",
      "type": "POST",
      "header": header,
      "query": query,
      "data": {
        isBatch: false,
        isWaiting: false,
        researchSource: "In App / Contact / Find / Single / searchPeople",
        reloadNonCseContactOnResearchDone: "Email", // 请求触发的来源，可以是Email/Phone/NULL, 不影响结果
        researchedAt: (new Date()).toISOString(), // (new Date()).toISOString() : "2019-11-04T01:34:05.558Z"
        // companyName: "Koan Health"
        // contactName: "DT Nguyen"
        // picture: "https://static-exp1.licdn.com/sc/p/com.linkedin.public-profile-frontend%3Apublic-profile-frontend-static-content%2B0.2.249/f/%2Fpublic-profile-frontend%2Fartdeco%2Fstatic%2Fimages%2Fghost-images%2Fperson.svg"
        // social: [{type: "linkedin", url: "https://www.linkedin.com/in/dt-nguyen-09a7a97"}]
        // title: "Chairman & CEO"
        ...newData,
      }
    };


    let counts = 0;
    let researchData;
    do{

      try {
        const response = await ufn.ajax(researchParams);
        researchData = response.data;
      } catch (e) {
        console.log('research error: ', e);
      }

      counts += 1;
    }while(counts <= this.requestLimit && !researchData)
    counts = 0

    // TODO, 需要处理没有返回data的情况
    if (!(researchData && researchData.id)) {
      console.log('no researchData'); return {};
    }

    // https://api.seamless.ai/api/users/contacts/783349594/reload?gaClientId=1106157709.1572830843&gaUserId=dNCXcfaY
    const reloadParams = {
      "url": `https://api.seamless.ai/api/users/contacts/${researchData.id}/reload`,
      "type": "GET",
      "header": header,
      "query": query,
    };


    let reloadData;
    do{

      try {
        const response = await ufn.ajax(reloadParams);
        reloadData = response.data;
      } catch (e) {
        console.log('reload error: ', e);
      }

      counts += 1;
    }while(counts <= this.requestLimit && !reloadData)
    counts = 0

    return reloadData || {};
  },

  // 将一个sheet转成最终的excel文件的blob对象，然后利用URL.createObjectURL下载
  sheet2blob: function (sheet, sheetName) {
      sheetName = sheetName || 'sheet1';
      var workbook = {
          SheetNames: [sheetName],
          Sheets: {}
      };
      workbook.Sheets[sheetName] = sheet;
      // 生成excel的配置项
      var wopts = {
          bookType: 'xlsx', // 要生成的文件类型
          bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
          type: 'binary'
      };
      var wbout = XLSX.write(workbook, wopts);
      var blob = new Blob([s2ab(wbout)], {type:"application/octet-stream"});
      // 字符串转ArrayBuffer
      function s2ab(s) {
          var buf = new ArrayBuffer(s.length);
          var view = new Uint8Array(buf);
          for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
          return buf;
      }
      return blob;
  },

  /**
   * 通用的打开下载对话框方法，没有测试过具体兼容性
   * @param url 下载地址，也可以是一个blob对象，必选
   * @param saveName 保存文件名，可选
   */
  openDownloadDialog: function (url, saveName) {
    if(typeof url === 'object' && url instanceof Blob) {
      url = URL.createObjectURL(url); // 创建blob地址
    }
    var aLink = document.createElement('a');
    aLink.href = url;
    aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效

    var event;
    if(window.MouseEvent) {
      event = new MouseEvent('click');
    } else {
      event = document.createEvent('MouseEvents');
      event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    }

    aLink.dispatchEvent(event);
  },

  jsonToExcelDownload: function(data) {
    for (let i = 0, len = data.length; i < len; i++) {
      const { researchedData } = data[i];
      if (!researchedData) {continue;}

      const appendData = this.handleResearchedData(researchedData);
      delete data[i].researchedData;
      Object.assign(data[i], appendData);
    }

    const sheet = XLSX.utils.json_to_sheet(data);

    const sheet2blob = this.sheet2blob(sheet);
    this.openDownloadDialog(sheet2blob, 'seamlessai-extension.xlsx');
  },

  //
  //
  getHeaderByRef: function(sheet) {
    // A1:B903 => ['A', 'B']
    const ref = sheet['!ref'];
    const regexp = /[A-E]/g;

    const refRange = ref.match(regexp);
    const start = refRange[0].charCodeAt(0);
    const end = refRange[1].charCodeAt(0);
    let header = {};

    for (let i = start; i <= end; i++) {
      const char = String.fromCharCode(i);

      if (sheet[`${char}1`]) {
        Object.assign(header, {[sheet[`${char}1`]['v']]: char});
      }
    }

    return header;
  },

  handleResearchedData: function(researchedData) {
    const {
      Company,
      Website,
      CompanyIndustry,
      CompanyLocation: TempCompanyLocation = {},
      CompanyStaffCount,
      CompanyStaffCountRange,
      Name: Contact,
      Title: ContactTitle,
      Email: BusinessEmail,
      PersonalEmail,
      Phone: CompanyPhone,
      contactPhone1: DirectPhone,
      ContactLocation: TempContactLocation = {},
      LIProfileUrl,
      updatedAt,
    } = researchedData;
    const { fullString: CompanyLocation } = TempCompanyLocation;
    const { fullString: ContactLocation } = TempContactLocation;

    return {
      Company,
      Domain: ufn.getUrlDomamin(Website),
      CompanyIndustry,
      CompanyLocation,
      CompanyStaffCount,
      CompanyStaffCountRange,
      Contact,
      ContactTitle,
      BusinessEmail,
      PersonalEmail,
      CompanyPhone,
      DirectPhone,
      ContactLocation,
      LIProfileUrl,
      updatedAt,
    };
  },

  main: async function() {
    this.setState({type: 'start'});

    const data = globalContacts;
    const query = this.getQuery();
    const header = this.getHeader();

    if (!(data && data.length)) {
      console.log('NO Data!');
      this.setState({
        type: 'error',
        param: 'No Data! Please upload file again.',
      });
      return;
    }

    if (!(header && header['Authorization'] && header['Seamlessai-fingerprint'])) {
      console.log('NO Authorization!');
      this.setState({
        type: 'error',
        param: 'No Authorization! Please login again.',
      });
      return;
    }

    if (contactsLimit < 1 || contactsLimit > 10) {
      console.log('limit is invalid!');
      this.setState({
        type: 'error',
        param: 'The limit is invalid! Please enter an integer from 1 to 10.',
      });
      return;
    }

    if (requestInterval < 0 || requestInterval > 60) {
      console.log('interval is invalid!');
      this.setState({
        type: 'error',
        param: 'The interval is invalid! Please enter an integer from 0 to 60.',
      });
      return;
    }

    this.setState({
      type: 'progress',
      param: {
        current: 0,
        total: data.length,
      },
    });

    for (let i = 0, len = data.length; i < len; i++) {
      const contacts = await this.queryContacts(data[i], query, header);
      console.log(contacts);

      if (!contacts || contacts.length === 0) {
        this.result.push({
          ...data[i],
        });
      } else {
        for (let j = 0, len = contacts.length; j < len; j++) {
          if (contacts[j].researchedData) {
            this.result.push({
              ...data[i],
              titleMatch: contacts[j].titleMatch,
              // titleMatch: parseInt(contacts[j].titleMatch * 100, 10) + '%',
              reloadId: contacts[j].researchedData.id,
              researchedData: contacts[j].researchedData,
            });
          } else {
            const researchContact = await this.researchContacts(contacts[j], query, header);

            this.result.push({
              ...data[i],
              titleMatch: contacts[j].titleMatch,
              reloadId: researchContact.id,
              researchedData: researchContact,
            });

            if (requestInterval) {
              await ufn.delayXSeconds(requestInterval);
            }
          }
        }
      }

      this.setState({
        type: 'progress',
        param: {
          current: i + 1,
          total: len,
        },
      });

      if (requestInterval) {
        await ufn.delayXSeconds(requestInterval);
      }
    }

    console.log(this.result);
    this.jsonToExcelDownload(this.result);
    this.setState({type: 'complete'});
  },
};



$(document).ready(function() {
  console.log('document ready');

  // interval, limit
  +function(){
    const inputDom = `
      <div style="margin: 16px 0 8px">
        <label style="margin: 0 8px 0 0">① </label>
        Click to download the configuration template file: <a href="javascript:;" id="download-match">Match</a>, <a href="javascript:;" id="download-search">Search</a>
      </div>
      <div style="margin: 16px 0 8px">
        <label for="excel-file" style="margin-right: 8px">② </label>
        <input type="file" id="excel-file" accept='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'>
      </div>
      <div style="margin: 16px 0 8px">
        <label style="margin-right: 8px">③ </label>
        <label>Interval:
          <input type="number" id="interval-input" value=${requestInterval} placeholder="0~60" step="1" min="0" max="60">
        </label>
        <label  style="margin-left: 8px">Limit:
          <input type="number" id="limit-input" value=${contactsLimit} placeholder="1~10" step="1" min="1" max="10">
          <span style="color: #b9bdbf">(limit is only used for searching!) </span>
        </label>
      </div>
      <div style="margin: 16px 0 8px">
        <label style="margin-right: 8px">④ </label>
        <div class="bilin-checkbox">
          <label>
            <input type="checkbox" id="score-input">Title Score:
          </label>
        </div>
        <span style="color: #b9bdbf">(only used for searching!) </span>
      </div>
      <div style="margin: 16px 0 8px">
        <label style="margin-right: 8px">⑤ </label>
        <button type="button" class="bilin-btn bilin-btn-primary bilin-btn-sm" id="startBtn" disabled>Start</button>
      </div>

      <div style="margin: 16px 0 8px">
        <label style="margin: 0 8px 0 0">Message: </label>
        <div id="bilin-message"></div>
      </div>
      <div class="bilin-progress-wrap" id="bilin-progress">
        <div class="bilin-progress-info">
          <div class="left-info">Progress: </div>
          <div class="right-info">-- / --</div>
        </div>
        <div class="bilin-progress"><div class="bilin-progress-bar" style="width: 0%; height: 8px;"></div></div>
      </div>
    `;

    $('#bilin-body').empty().append(inputDom);
  }();

  $('#excel-file').change(function(e) {
    var files = e.target.files;
    var fileReader = new FileReader();
    fileReader.onload = function(ev) {
      try {
        var data = ev.target.result
        var workbook = XLSX.read(data, {
          type: 'binary'
        }) // 以二进制流方式读取得到整份excel表格对象
      } catch (e) {
        console.error('The type of the uploaded file is invalid');
        $('#bilin-message').empty('The type of the uploaded file is invalid').append();
        return;
      }
      console.log("upload workbook: ", workbook);

      var fromTo = ''; // 表格的表格范围，可用于判断表头是否数量是否正确
      var sheetData = []; // 存储获取到的数据
      // 遍历每张表读取
      for (let sheet in workbook.Sheets) {
        if (workbook.Sheets.hasOwnProperty(sheet)) {

          const headerObj = fun.getHeaderByRef(workbook.Sheets[sheet]);
          const headerArr = Object.keys(headerObj);

          sheetData = sheetData.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));

          if (!headerArr.includes('contact')) {
            const obj = sheetData.reduce((acc, cur)=>{
              const keys = Object.keys(cur);

              for (let i = 0, len = keys.length; i < len; i++) {
                if (!acc[keys[i]]) {
                  acc[keys[i]] = [];
                }

                acc[keys[i]].push(cur[keys[i]]);
              }

              return acc;
            }, {});

            const { company, title } = obj;
            const searchData = [];
            for (let i = 0, cLen = company.length; i < cLen; i++) {
              for (let j = 0, tLen = title.length; j < tLen; j++) {
                searchData.push({
                  company: company[i],
                  title: title[j],
                });
              }
            }

            sheetData = searchData;
          }
        }
        // break; // 如果只取第一张表，就取消注释这行
      }
      //在控制台打印出来表格中的数据
      console.log("contacts to search: ", sheetData);
      $('#startBtn').prop('disabled', false);
      globalContacts = sheetData;
    };

    // 以二进制方式打开文件
    if(!files.length) {return;}
    fileReader.readAsBinaryString(files[0]);
  });

  $('#interval-input').change(function(e) {
    const input = parseInt(e.target.value, 10);
    requestInterval = input;
  });

  $('#limit-input').change(function(e) {
    const input = parseInt(e.target.value, 10);
    contactsLimit = input;
  });

  $('#score-input').change(function(e) {
    // console.log($(this).prop('checked'));
    scoreEnable = $(this).prop('checked');
  });

  $('#download-match').on('click', function(event) {
    const template = [
      {
        contact: 'contact01',
        title: 'title01',
        company: 'company01',
      },
      {
        contact: 'contact02',
        title: 'title02',
        company: 'company02',
      },
      {
        contact: 'contact03',
        title: 'title03',
        company: 'company03',
      },
    ];

    var sheet = XLSX.utils.json_to_sheet(template);
    const sheet2blob = fun.sheet2blob(sheet);
    fun.openDownloadDialog(sheet2blob, 'template-match.xlsx');

  });

  $('#download-search').on('click', function(event) {
    const template = [
      {
        company: 'company01',
        title: 'title01',
      },
      {
        company: 'company02',
        title: 'title02',
      },
      {
        company: 'company03',
      },
    ];

    var sheet = XLSX.utils.json_to_sheet(template);
    const sheet2blob = fun.sheet2blob(sheet);
    fun.openDownloadDialog(sheet2blob, 'template-search.xlsx');
  });

  $('#startBtn').on('click', function(event) {
    event.preventDefault();
    /* Act on the event */

    fun.main();
  });
});
