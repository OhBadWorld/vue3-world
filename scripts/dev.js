// 这个文件会帮我们打包 packages下的模块，最终打包出js文件
// node dev.js (要打包的名字 -f打包的格式) === argv.slice(2)
// 例如：node dev.js reactivity -f esm

import minimist from 'minimist';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import esbuild from 'esbuild';
// node中的命令行参数通过process 来获取 process.argv
const argv = minimist(process.argv.slice(2));

const target = argv._[0] ||"reactivity";//打包哪个项目
const format = argv.f || "iife"; // iife 立即执行函数 打包后的模块规范 (function(){})()

// node中的es module 中没有__dirname 可以使用import.meta.dirname 来获取当前文件所在的目录
// 直接使用 __dirname 会报错 __dirname is not defined in ES module scope
console.log(target, format);

// esm 使用commonjs 变量
// node中的es module 中没有__dirname
// node中的es module 中没有require
const __filename = fileURLToPath(import.meta.url); // 当前的文件路径（文件路径）
const __dirname = dirname(__filename); // 当前的目录路径（文件夹路径）
const require = createRequire(import.meta.url); // 可以使用require来引入CommonJS模块
console.log('__filename =>', __filename);
console.log('__dirname =>', __dirname);

// 入口文件 根据命令行提供的路径来解析
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
// const entry = resolve(import.meta.dirname, `../packages/${target}/src/index.ts`);
console.log(entry);

const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));
// 打包 根据需要进行打包
esbuild.context({
  entryPoints: [entry], // 入口文件
  outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), // 输出文件
  format, // 打包的格式 cjs(modules.exports...) eesm(import ... from ...) iife(立即执行函数 (function(){})() )
  bundle: true, // 打包成一个文件 reactivity -> shared 会打包到一起
  sourcemap: true, // 生成sourcemap 文件 方便调试
  platform: 'browser', // 打包的平台 浏览器(浏览器环境)
  globalName: pkg.buildOptions?.name, // 全局变量名
}).then((ctx) => {

  return ctx.rebuild().then(() => {
    console.log(`打包成功 ${target}`);
    return ctx.watch(); // 监听文件变化 持续打包 自动打包
  });
});
