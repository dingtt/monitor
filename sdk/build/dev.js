const path = require('path');
const chokidar = require('chokidar');
const Koa = require('koa');
const KoaStatic = require('koa-static');
const compileTask = require('./compile_task');
const configList = require('./rollup.config.dev');

const app = new Koa();
const projectPath = path.join(__dirname, '..');
const srcPath = path.join(projectPath, 'src')

function watchSrc () {
  chokidar.watch(srcPath, {
    ignored: /(^|[\/\\])\../
  }).on('all', (event, path) => {
    if ( event === 'change' ) {
      console.log(event)
      compileTask(configList);
    }
  });
}

app.use(KoaStatic(projectPath))
app.listen(3001, function(){
  console.log('listen');
  compileTask(configList);
  watchSrc()
})


