var ufn = {
  getUrlDomamin: function(url) {
    if (!url) {return;}

    let temp;

    if (url.indexOf("://") > -1) {
        temp = url.split('/')[2];
    } else {
        temp = url.split('/')[0];
    }

    //find & remove port number
    temp = temp.split(':')[0];
    //find & remove "?"
    temp = temp.split('?')[0];

    let splitArr = temp.split('.'),
        arrLen = splitArr.length;

    //extracting the root temp here
    //if there is a subtemp
    if (arrLen > 2) {
        temp = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
        if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
            //this is using a ccTLD
            temp = splitArr[arrLen - 3] + '.' + temp;
        }
    }
    return temp;
  },
  exportCsv: function (obj) {

    // let datas = obj.data;
    //处理字符串中的, "
    // obj['data'] = obj['data'].map(function(elem) {

    //   if (elem['job_title'] && /[",\r\n]/g.test(elem['job_title'])) {
    //     elem['job_title'] = '"' + elem['job_title'].replace(/(")/g, '""') + '"';
    //   }

    //   if (elem['company'] && /[",\r\n]/g.test(elem['company'])) {
    //     elem['company'] = '"' + elem['company'].replace(/(")/g, '""') + '"';
    //   }

    //   if (elem['industry'] && /[",\r\n]/g.test(elem['industry'])) {
    //     elem['industry'] = '"' + elem['industry'].replace(/(")/g, '""') + '"';
    //   }

    //   if (elem['location'] && /[",\r\n]/g.test(elem['location'])) {
    //     elem['location'] = '"' + elem['location'].replace(/(")/g, '""') + '"';
    //   }

    //   if (elem['headquarters'] && /[",\r\n]/g.test(elem['headquarters'])) {
    //     elem['headquarters'] = '"' + elem['headquarters'].replace(/(")/g, '""') + '"';
    //   }

    //   if (elem['date'] && /[",\r\n]/g.test(elem['date'])) {
    //     elem['date'] = '"' + elem['date'].replace(/(")/g, '""') + '"';
    //   }

    //   if (elem['employees'] && /[",\r\n]/g.test(elem['employees'])) {
    //     elem['employees'] = '"' + elem['employees'].replace(/(")/g, '""') + '"';
    //   }

    //   if (elem['revenue'] && /[",\r\n]/g.test(elem['revenue'])) {
    //     elem['revenue'] = '"' + elem['revenue'].replace(/(")/g, '""') + '"';
    //   }

    //   if (elem['about_link'] && /[",\r\n]/g.test(elem['about_link'])) {
    //     elem['about_link'] = '"' + elem['about_link'].replace(/(")/g, '""') + '"';
    //   }

    //   if (elem['competitors'] && /[",\r\n]/g.test(elem['competitors'])) {
    //     elem['competitors'] = '"' + elem['competitors'].replace(/(")/g, '""') + '"';
    //   }

    //   return elem;
    // });

    // let KeyArray = ['job_title','company','industry','location','headquarters','date'，'employees'，'revenue'，'about_link'，'competitors'];

    //title ["","",""]
    let title = obj.title;
    //titleForKey ["","",""]
    let titleForKey = obj.titleForKey;
    let data = obj.data;
    let str = [],
        item = [];

    str.push(obj.title.join(",")+"\n");

    for(let i = 0, dLength = data.length; i < dLength; i++){

      item = [];

      for(let j = 0, tLength = titleForKey.length ; j < tLength; j++){

          let value = data[i][titleForKey[j]];

          if (value && /[",\r\n]/g.test(value)) {
            value = '"' + value.replace(/(")/g, '""') + '"';
          }

          item.push(value);
      }
      str.push(item.join(",")+"\n");
    }

    //let url = 'data:text/csv;charset=utf-8,' + encodeURIComponent("\uFEFF" + str.join(""));  //添加BOM头

    str = "\uFEFF" + str.join("")
    let blob = new Blob([str], {type: 'text/csv,charset=UTF-8'});
    let csvUrl = URL.createObjectURL(blob);

    let downloadLink = document.createElement("a");
    downloadLink.href = csvUrl;
    downloadLink.download = obj.fileName+".csv";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    return true;
  },
  getIndustry: function() {
    let result = [],
        $lis = $('.flyout').children('li');

    for (let i = 0; i < $lis.length; i++) {
      let $li = $($lis[i]),
          $text = $li.children('.label'),
          element = {};

      element['id'] = $li.val();
      let temp = $text.text();

      let index = temp.indexOf('(');

      element['industry'] = temp.slice(0, index)

      result.push(element);

    }
    ufn.exportCsv({
      title:['ID','Industry',],
      titleForKey:['id', 'industry'],
      data: result,
      fileName: 'industry',
    });
  },
  ajax: function(params) {
    const {url, type, query, data, header = {}, timeout = 20000} = params;
    let newUrl = url;

    if (type === 'POST' && query && Object.keys(query).length) {
      newUrl = url + this.queryParams(query, true);
    }

    return new Promise(function(resolve, reject){
      $.ajax({
        url: newUrl,
        type: type,
        timeout: timeout,
        // dataType: 'json',
        data: JSON.stringify(data),
        // accepts: 'application/json',
        // contentType: 'application/json',
        headers: {
          'Seamlessai-Is-Webapp': 1,
          'Accepts': 'application/json',
          'Content-Type': 'application/json',
          // 'Sec-Fetch-Mode': 'cors',
          // 'Authorization': 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6Imxpbi53YW5nQGJpbGludGVjaC5jb20iLCJmaXJzdG5hbWUiOiJMSW4iLCJsYXN0bmFtZSI6IldhbmciLCJjb21wYW55IjoiQmlsaW4iLCJzZXNzaW9uSWQiOjY3ODI0LCJzZXNzaW9uU2Vzc2lvbklkIjoiQmhnMXNFMGIwZW02TGxXWDlOV3EzRlZzNkphejFHQUJtTUs4RXV2byJ9.5nx-o05ROYzNx32YwH-zeL7_ZG2YPbSDkc-RLBpOOTk',
          // 'Seamlessai-fingerprint': 'cc67e88b704538d1f92d40f121eb99ae',
          ...header,
        }

      })
      .done(function(res,textStatus) {
        resolve(res);
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        // console.log(jqXHR);
        console.log(textStatus);
        reject(jqXHR.statusText);
      });
    });
  },

  queryParams (data, isPrefix = false) {
    let prefix = isPrefix ? '?' : '';
    let _result = [];

    for (let key in data) {
      let value = data[key]
      // 去掉为空的参数
      if (['', undefined, null].includes(value)) {
        continue
      }
      if (value.constructor === Array) {
        value.forEach(_value => {
          _result.push(encodeURIComponent(key) + '[]=' + encodeURIComponent(_value))
        })
      } else {
        _result.push(encodeURIComponent(key) + '=' + encodeURIComponent(value))
      }
    }

    return _result.length ? prefix + _result.join('&') : ''
  },

  // 延时函数,延时s
  delayXSeconds: function(x) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, x*1000);
    });
  },
};

/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path], domain)
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

var docCookies = {
  getItem: function (sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[-.+*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[-.+*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  /* optional method: you can safely remove it! */
  keys: function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};