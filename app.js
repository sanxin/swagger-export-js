let express = require('express');
let request = require('request');

/** 导入querystring模块（解析post请求数据） */
let querystring = require('querystring');
let app = express();

let writeService = require('./writeService');

/** 设置跨域访问 */
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    res.header("X-Powered-By", '3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");

    next();
});

/** 获取swagger地址返回内容的接口 */
app.get("/swaggerContent", function (req, res) {
    request(req.query.path, function (err, response, body) {
        res.status(200);
        let data = JSON.parse(body);
        res.json(data)
    })

})

/** 导出解析的内容，生成js文件到本地的接口 */
app.post("/createJs", function (req, res) {
    if (req.method === 'POST') {
        let data = '';
        req.on('data', function (chunk) {
            data += chunk;
        });
        req.on('end', function () {
            let dataObject = querystring.parse(data);
            let { isPrefix, list } = dataObject;
            list = JSON.parse(list);
            list.forEach(el => {
                // 去掉 字符中的 空格间隔，将连接起来的字段作为生成的js文件名
                let _fn = el.description.replace(/\s*/g, "");
                writeService.writeFn(el.children, _fn + ".js", isPrefix);
            });
            res.json({ msg: "success" });
        });
    }
})


//配置服务端口
let server = app.listen(8000, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log('Example app listening at http://' + host + port);
});
