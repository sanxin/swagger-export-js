let fs = require("fs");

function writeFn(list, name, isPrefix) {
    let _content = `import http, { URL, paresJsonToForm } from '@/api/index.js';\nimport qs from 'qs';\n`;
    list.forEach(el => {
        let _item = handleUrl(el, isPrefix);
        _content = _content + _item;
    });

    let filePath = 'dist/';
    isDist(filePath).then(res => {
        fs.writeFile('dist/' + name, _content, function () {
        })
    });
}
function handleUrl(data, isPrefix) {
    let { method, consumes, id, summary } = data;
    // 路径上带着文件类型(例如xxx.pdf)
    if (id.includes('.')) {
        id = id.split('.')[0];
    }
    let _pathArr = []; // 去掉{}的路径字段数组
    let _pathStr = id; // 路径地址
    let _pathAttr = ''; // 路径参数
    let _name = ""; // 接口名称
    // 路径上带着变量(例如/{id})
    if (id.includes('{')) {
        let _arr = id.split('/').slice(1);
        let _parr = []; // 改变之后的路径数组
        _pathArr = _arr.map(el => {
            if (el.includes('{')) {
                let _s = el.substring(1, el.length - 1);
                _parr.push('${params.' + _s + '}');
                return _s;
            } else {
                _parr.push(el);
                return el;
            }
        });
        _pathStr = _parr.join('/');
    } else {
        _pathArr = [...id.split('/').slice(1)];
    }
    // 处理路径传参
    if (['get', 'delete'].includes(method)) {
        _pathAttr = id.includes('{') ? ')' : ` + "?" + qs.stringify(params))`;
    }
    if (['post', 'put'].includes(method)) {
        _pathAttr = id.includes('{') ? ')' : `, params)`;
        if (consumes[0] == 'multipart/form-data') {
            _pathAttr = `, paresJsonToForm(params), { "Content-Type": "multipart/form-data" })`;
        }
    }
    // 处理接口名称
    if (_pathArr.length > 3) {
        _name = `${_pathArr[0]}_${_pathArr[_pathArr.length - 2]}_${_pathArr[_pathArr.length - 1]}`;
    } else {
        _name = _pathArr.join('_');
    }
    let _url = `return http.${method}` + '(`' + `${isPrefix == 'true' ? '${URL}' : ''})${_pathStr}` + '`';

    let _item = `// ${summary}\nexport const ${_name} = params => {\n    ${_url}${_pathAttr}\n}\n`;
    return _item;
}

function isDist(filePath) {
    return new Promise((resolve, reject) => {
        fs.exists(filePath, function (exists) {
            if (!exists) {
                fs.mkdir(filePath, function (err) {
                    resolve()
                    if (err) {
                        reject()
                    }
                })
            } else {
                resolve()
            }
        });
    })
}
module.exports = { writeFn }
