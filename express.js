const http = require('http')
const slice = Array.prototype.slice

class LinkExpress {
  constructor() {
    this.routes = { //存放中间件列表
      all: [], // app.use
      post: [],// app.post
      get: [] //app.get
    }
  }

  static register(path) { // 注册函数 用于判断是app.use()中的路径
    const info = {} // 定义对象
    if (typeof path === 'string') { //有路径的条件下
      info.path = path // 将路径放入对象中
      info.stack = slice.call(arguments, 1) // 因为有路径的情况下,第一个参数是路径 第二个参数才是执行的中间件
    } else {
      info.path = '/'; // 没有路径的情况下  默认是有一个全局的路径的
      info.stack = slice.call(arguments, 0) // 因为没有路径 所以第一个参数就是执行的中间件
    }
    return info // 返回给调用该函数的对象
  }

  use() {
    const info = LinkExpress.register.apply(this, arguments); //将注册函数的自身以及参数 赋值给 新变量
    this.routes.all.push(info) // 放入对应条件的列表中
  }

  get() {
    const info = LinkExpress.register.apply(this, arguments);
    this.routes.get.push(info)
  }

  post() {
    const info = LinkExpress.register.apply(this, arguments);
    this.routes.post.push(info)
  }

  match(url, methods) { // 过滤函数
    let stack = []; // 定义初始值
    if (url === '/favicon.ico') { // 判断是否为浏览器发起的小图标请求
      return stack
    }

    let curRoutes = [];
    curRoutes = curRoutes.concat(this.routes.all); // 合并use中间件的参数
    curRoutes = curRoutes.concat(this.routes[methods]);  //根据methods来觉得是合并post 还是 get

    curRoutes.forEach(data=>{
      if (url.indexOf(data.path) === 0) { // 判断路由的路径命中的情况下
        stack =stack.concat(data.stack) // 取出中间件
      }
    });
    return stack // 将拿到的中间件返回给调用者
  }
  handle (req,res,stack) {
    const next = () =>{ //定义next 函数
      const middleware = stack.shift() // 拿到第一个匹配的中间件参数
      if (middleware) {
        // 执行中间件
        middleware(req,res,next)
      }
    };
    next()
  }

  callback() {
    return (req, res) => {
      res.json=(data) =>{ // 设置返回格式
        res.setHeader('Content-type', 'application/json');
        res.end(
          JSON.stringify(data)
        )
      };
      const url = req.url; // 从req.url拿到路径
      const methods = req.method.toLowerCase(); // 从req.method拿到请求的方法

      const match = this.match(url, methods); // 把路径和请求方法传入
      this.handle(req,res,match) // 把req,res,和中间件传入

    }
  }

  listen(...agrs) {
    const server = http.createServer(this.callback());
    server.listen(...agrs)
  }
}

module.exports = () => {
  return new LinkExpress()
}
