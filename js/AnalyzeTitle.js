class AnalyzeTitle {
	constructor(titles) {
		this.title_list = this._init_title_list(titles);

		// ['abc bcd', 'cde fg']
		//
		// {
		//   'abc bcd': ['abc','bcd'],
		//   'cde fg': ['cde','fg'],
		// }
	}

	_init_title_list(title_list){
		const result = {};
		for (const title of title_list) {
			const format = this.title_format(title);
			const titles = format.trim().split(/\s+/);
			result[title] = titles;
		}
		return result;
	}

	title_format(title) {
		//
		// 去除 title 中无意义字符,并转换为小写
		//
		// stop words maybe over fit(some words may is keyword),here just remove some simple words
		// from nltk.corpus import stopwords
		// stop = set(stopwords.words('english'))

		// remove , . & - and of for at on llc / inc | Ltd + : ; @ ! ( ) the that this

		return title.toLowerCase()
			.replace(",", " ")
			.replace(".", "")
			.replace("-", " ")
			.replace(" & ", " ")
			.replace(" of ", " ")
			.replace(" and ", " ")
			.replace(" for ", " ")
			.replace(" at ", " ")
			.replace(" on ", " ")
			.replace(" llc ", " ")
			.replace("/", " ")
			.replace(" inc ", " ")
			.replace("|", " ")
			.replace("ltd", " ")
			.replace(" + ", " ")
			.replace(";", " ")
			.replace(":", " ")
			.replace("@", " ")
			.replace("!", "")
			.replace("(", "")
			.replace(")", "")
			.replace(" the ", " ")
			.replace(" this ", " ")
			.replace(" that ", " ")
	}

	// 计算交集
	simuate_intersection(title_item_list, provide_itle_list) {
		const bSet = new Set(provide_itle_list);
		return title_item_list.filter(val => bSet.has(val));
	}

	// 计算并集
	simuate_join(title_item_list, provide_itle_list) {
		return [...new Set([...title_item_list, ...provide_itle_list])]
	}

	get_intsersection_all(format_title_list) {
		const result = {};

		for (const title in this.title_list) {
			const keys = this.title_list[title];
			const inster_words = this.simuate_intersection(format_title_list, keys);
			if (inster_words.length === keys.length) {
				result[title] = keys;
			}
		}
		return result;
	}

	get_all_join(format_title_list, inter_result) {
		//
		// 遍历完全交集得列表，依次求并集，然后使用交集结果数除以并集数，得出分数，取最大的一个返回
		//
		let result_item = '';
		let result_score = 0;

		for (const item in inter_result) {
			const tmp_keys = inter_result[item];
			const join_words = this.simuate_join(format_title_list, tmp_keys);

			if (join_words.length === 0) {continue;}

			const score = tmp_keys.length / join_words.length;
			if (score > result_score) {
				result_score = score;
				result_item = item;
			}
		}
		return {result_item, result_score};
	}

	title_score(title) {
		const format_title_init = this.title_format(title).trim().split(/\s+/);
		const result = this.get_intsersection_all(format_title_init);

		let item = 'None';
		let score = 0;

		if (Object.keys(result).length > 0) {
			const obj = this.get_all_join(format_title_init, result);
			item = obj.result_item;
			score = obj.result_score;
		}
		return { item, score };
	}
}

// const titles = ['ceo', 'president', 'vice president1', 'vice President 1Operations']
// const title = 'Vice President Operations'
// const a = new AnalyzeTitle(titles);
// const { item, score } = a.title_score(title);

// console.log(title);
// console.log(item);
// console.log(score);