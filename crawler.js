const fs = require('fs');
const superagent = require('superagent');
const cheerio = require('cheerio');
const async = require('async');
const rimraf = require('rimraf');

const indexPage = 'https://www.douban.com/group/haixiuzu/?type=essence#topics';
    const dir = './haixiuzu';

superagent
    .get(indexPage)
    .end((err, rs) => {
        const list = [];
        const img_url_list = [];
        const $ = cheerio.load(rs.text);
        let count = 1;

        // 获取所有帖子
        $('#group-topics td.title a').each((idx, el) => {
            list.push($(el).attr('href'));
        });

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

                    $('#link-report div.topic-figure.cc img').each((idx, el) => {
                        img_url_list.push($(el).attr('src'));
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
                    filename = /public\/([\S\s]+)$/i.exec(url)[1];
                    console.log(filename);
                } catch (e) {
                    callback(e);
                    return;
                }

                superagent
                    .get(url)
                    .pipe(fs.createWriteStream(dir + '/' + filename).on('finish', () => {
                        callback();
                    }));

            }, (err) => {
                if (err) {
                    throw err;
                }

                console.log('所有图片爬取完成！');
            });
        });
    });
