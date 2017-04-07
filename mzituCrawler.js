
const fs = require('fs');
const superagent = require('superagent');
const cheerio = require('cheerio');
const async = require('async');
const rimraf = require('rimraf');

const indexPage = 'http://www.mzitu.com/taiwan';
const dir = './taiwan/';
let imgcount = 0;

persons(indexPage,dir);
function persons(indexPage,dir){
    superagent
        .get(indexPage)
        .end((err, rs) => {
            const list = [];
            const person_url_list = [];
            const $ = cheerio.load(rs.text);
            let count = /page\/([\S\s]+)$/i.exec($('.nav-links a:last-child').prev('a').attr('href'))[1];
            count = 1;
            for(let i = 1;i<=count;i++){
                list.push(indexPage + '/page/'+i);
            };

            async.eachLimit(list, 10, (url, callback) => {
                superagent
                    .get(url)
                    .end((err, rs) => {

                        if (err) {
                            callback(err);
                            return;
                        }
                        const $ = cheerio.load(rs.text);
                        $('#pins>li>a').each((idx, el) => {
                            person_url_list.push({url:$(el).attr('href'),dirname:$(el).find('img').attr('alt')});
                        });


                        callback();
                    });
            }, (err) => {
                if (err) {
                    throw err;
                }
                try {
                    // fs.rmdirSync(dir);
                    rimraf.sync(dir);

                } catch (e) {} finally {
                    fs.mkdirSync(dir);

                }


                async.eachLimit(person_url_list, 10, (url, callback) => {


                    try {
                        person(url.url,dir+url.dirname,callback);
                        // console.log(imgcount++)
                        // callback()
                    } catch (e) {
                        callback(e);
                        return;
                    }

                }, (err) => {
                    if (err) {
                        throw err;
                    }

                    console.log('所有图片爬取完成!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!！');
                });
            });
        });
};
function person(indexPage,dir,personEnd){
    superagent
        .get(indexPage)
        .end((err, rs) => {
            const list = [];
            const img_url_list = [];
            const $ = cheerio.load(rs.text);
            let count = $('.pagenavi a:last-child').prev('a').find('span').html();

            // // 获取
            for(let i = 1;i<=count;i++){
                list.push(indexPage + '/'+ i);
            };

            async.eachLimit(list, 10, (url, callback) => {
                superagent
                    .get(url)
                    .end((err, rs) => {
                        console.log(url);
                        const $ = cheerio.load(rs.text);

                        if (err) {
                            callback(err);
                            return;
                        }

                        $('.main-image a img').each((idx, el) => {
                            let obj = {url:$(el).attr('src'),filename:'' + idx};
                            img_url_list.push(obj);
                        });

                        callback();
                    });
            }, (err) => {
                if (err) {
                    throw err;
                }

                try {
                    // fs.rmdirSync(dir);
                    rimraf.sync(dir);

                } catch (e) {} finally {
                    fs.mkdirSync(dir);

                }

                async.eachLimit(img_url_list, 10, (url, callback) => {

                    let filename;

                    try {
                        filename = url.filename + (url.url).slice(-9);
                    } catch (e) {
                        callback(e);
                        return;
                    }
                    superagent
                        .get(url.url)
                        .pipe(fs.createWriteStream(dir + '/' + filename).on('finish', () => {
                            callback();
                            // console.log(imgcount++)
                        })).on('error',callback);

                }, (err) => {
                    if (err) {
                        throw err;
                    }

                    console.log('图片爬取完成！');
                    console.log(imgcount++)
                    personEnd();
                });
            });
        });
};

