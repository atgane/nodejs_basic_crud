const http = require("http");
const fs = require("fs");
const url = require('url');
const querystring = require('querystring');

createTemplateHTML = (fileList, controlUnit, contents) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  <body>
    <!--header-->
    <a href="/"><h1>CRUD Practice</h1></a>
    ${fileList}
    ${controlUnit}
    ${contents}
  </body>
  </html>
  `
};

createFileListHTML = (data) => {
  var ans = '';
  ans += '<ul>';
  for (const fileName of data) {
    ans += `<li><a href="/?id=${fileName}">${fileName}</a></li>`;
  }
  ans += '</ul>';
  return ans
}

const server = http.createServer((request, response) => {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathName = url.parse(_url, true).pathname;
  
  if (pathName === `/`) {
    if (queryData.id === undefined) {
      fs.readdir('database', `utf-8`, (err, data) => {
        var fileList = createFileListHTML(data);
        var utility = `
        <form action="/create" method="post">
          <input type="submit" value="create"></input>
        </form>
        <p>
        `;
        var contents = `
        <h1>Main page</h1>
        welcome to CRUD Practice!<p>
        `;

        template = createTemplateHTML(fileList, utility, contents);
        
        response.writeHead(200);
        response.end(template);
      });
    }
    else {
      fs.readdir('database', `utf-8`, (err, data) => {
        var fileList = createFileListHTML(data);
        var utility = `
        <form action="/create" method="post">
          <input type="submit" value="create"></input>
        </form>
        <form action="/update" method="post">
          <input name="pastTitle" type="hidden" value="${queryData.id}"></input>
          <input type="submit" value="update"></input>
        </form>
        <form action="/delete_process" method="post">
          <input name="deleteTitle" type="hidden" value="${queryData.id}"></input>
          <input type="submit" value="delete"></input>
        </form>
        <p>
        `;

        fs.readFile(`database/${queryData.id}`, 'utf-8', (err, data) => {
          template = createTemplateHTML(fileList, utility, `<h1>${queryData.id}</h1>` + `${data}`);
          response.writeHead(200);
          response.end(template);
        
        });
      });
    }
  }
  else if (pathName === "/create") {
  fs.readdir('database', `utf-8`, (err, data) => {
    var fileList = createFileListHTML(data);
    var utility = `
    <h1>create</h1>
    <form action="/create_process" method="post">
      <input name="title" type="text" placeholder="title"></input><p>
      <textarea name="contents" placeholder="contents"></textarea><p>
      <input type="submit" value="create">
    </form>
    `;

    template = createTemplateHTML(fileList, utility, ``);
    
    response.writeHead(200);
    response.end(template);
  });
  }
  else if (pathName === "/create_process") {
    var body = '';
    request.on('data', (data) => {
      body += data;
      if (body.length > 100) {
        request.connection.destroy();
      }
      request.on('end', () => {
        var post = querystring.parse(body);
        var title = post.title;
        var contents = post.contents;
        fs.writeFile(`database/${title}`, `${contents}`, (err) => {
          response.writeHead(302, {'Location': `/?id=${title}`});
          response.end();
        });
      });
    });
  }
  else if (pathName === "/update") {
    var body = ``;
    request.on('data', (data) => {
      body += data;
      request.on('end', () => {
        var post = querystring.parse(body);
        var pastTitle = post.pastTitle;
        fs.readdir('database', `utf-8`, (err, data1) => {
          fs.readFile(`database/${pastTitle}`, 'utf-8', (err, data2) => {
            var fileList = createFileListHTML(data1);
            var utility = `
            <h1>update</h1>
            <form action="/update_process" method="post">
              <input name="pastTitle" type="hidden" value="${pastTitle}"></input>
              <input name="title" type="text" placeholder="title" value="${pastTitle}"></input><p>
              <textarea name="contents" placeholder="contents">${data2}</textarea><p>
              <input type="submit" value="update">
            </form>
            `;
            template = createTemplateHTML(fileList, utility, ``);
            response.writeHead(200);
            response.end(template);
          });
        });
      });
    });
  }
  else if (pathName === "/update_process") {
    var body = '';
    request.on('data', (data) => {
      body += data;
      if (body.length > 100) {
        request.connection.destroy();
      }
      request.on('end', () => {
        var post = querystring.parse(body);
        var pastTitle = post.pastTitle;
        var title = post.title;
        var contents = post.contents;
        fs.rename(`database/${pastTitle}`, `database/${title}`, (err) => {
          fs.writeFile(`database/${title}`, contents, 'utf-8', (err) => {
            response.writeHead(302, {'Location': `/?id=${title}`});
            response.end();
          });
        });
      });
    });
  }
  else if (pathName === "/delete_process") {
    var body = '';
    request.on('data', (data) => {
      body += data;
    });
    request.on('end', () => {
      var post = querystring.parse(body);
      var deleteTitle = post.deleteTitle;
      fs.unlink(`database/${deleteTitle}`, (err) => {
        response.writeHead(302, {'Location': '/'});
        response.end();
      });
    });
  }
  else {
    response.writeHead(404);
    response.end('<h1>Not Found</h1>');
  }
});

server.listen(8080);
