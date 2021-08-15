const Koa = require("koa");
const fs = require("fs");
const app = new Koa();
const path = require("path");
const compilerSFC = require("@vue/compiler-sfc");
const compilerDom = require("@vue/compiler-dom");

const RESPONSE_TYPE = {
    TEXT: "text/html",
    JS: "application/javascript",
}


app.use(ctx => {
    const {url, query} = ctx;
    if (url === "/") {
        ctx.type = RESPONSE_TYPE.TEXT;
        ctx.body = fs.readFileSync("./index.html", "utf8");
    } else if (url.endsWith(".js")) {
        const p = path.join(__dirname, url);
        ctx.type = RESPONSE_TYPE.JS;
        ctx.body = rewriteImport(fs.readFileSync(p, "utf8"));
    } else if (url.startsWith('/@modules/')) {
        const moduleName = url.replace("/@modules/", "");
        const prefix = path.join(__dirname, "../node_modules", moduleName);
        const module = require(prefix + "/package.json").module;
        const filePath = path.join(prefix, module);
        const ret = fs.readFileSync(filePath, "utf8");
        ctx.type = RESPONSE_TYPE.JS;
        ctx.body = rewriteImport(ret);
    } else if (url.indexOf(".vue") > -1) {
        const p = path.join(__dirname, url.split("?")[0]);
        const ast = compilerSFC.parse(fs.readFileSync(p, "utf8"));
        // console.log(ast);
        if (!query.type) {
            // SFC請求
            // 取vue文件,解析為js
            // 獲取script部分的內容
            const scriptContent = ast.descriptor.script.content;
            const script = scriptContent.replace(
                "export default ",
                "const __script = "
            );
            ctx.type = RESPONSE_TYPE.JS;
            ctx.body = `
               ${rewriteImport(script)}
               //解析 template
               import { render as __render} from '${url}?type=template'
               __script.render = __render
               export default __script
            `
        } else if(query.type === "template") {
            const template = ast.descriptor.template.content;
            console.log(template)
            const render = compilerDom.compile(template, {mode: "module"}).code
            ctx.type = RESPONSE_TYPE.JS;
            ctx.body = rewriteImport(render);
        }
    }
})


// import xx from vue
// import xxx from @modules/vue
const rewriteImport = (content) => {
    ;
    return content.replace(/from ['"](.*)['"]/g, (s1, s2) => {
        if (["./", "/", "../"].some(relative => s2.startsWith(relative))) {
            return s1;
        } else {
            return ` from '/@modules/${s2}'`;
        }
    });
}


app.listen(3002, () => {
    console.log("server start!")
});
