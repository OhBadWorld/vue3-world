node环境 22.19.0

.npmrc 文件
  shamefully-hoist=true 排平安装的依赖

终端删除操作
rm -rf node_modules

开发环境安装依赖
pnpm install typescript esbuild minimist -D -w
esbuild 打包插件
minimist 解析命令行参数 
-w 表示依赖安装在根目录

// 把本地的@vue/shared 安装到 @vue/reactivity 中
pnpm install @vue/shared --workspace --filter @vue/reactivity

执行命令 pnpm run dev

参考链接（他人掘金）：https://juejin.cn/post/7353292009086337058
教程链接（B站）：https://www.bilibili.com/video/BV1zBc2e4EaZ?vd_source=342e5c8d91f6ac5b453d6e8b23bf5998&spm_id_from=333.788.player.switch&p=5
参考链接（B站）：https://www.bilibili.com/video/BV1jrCGY1Euu?spm_id_from=333.788.recommend_more_video.0&trackid=web_related_0.router-related-2206146-t48nw.1768632451982.981&vd_source=342e5c8d91f6ac5b453d6e8b23bf5998

他人学习仓库1：https://gitee.com/mrzym/vue3.4.23-cource-code
他人学习仓库2：https://github.com/BetterChinglish/vue3Source/blob/v1.0.0/read/01%20%E5%93%8D%E5%BA%94%E7%B3%BB%E7%BB%9F/summary.md