const path = require("path")
const { babel } = require("@rollup/plugin-babel")
// const buble = require("@rollup/plugin-buble")
const typescript = require("@rollup/plugin-typescript")
const { nodeResolve } = require("@rollup/plugin-node-resolve")
const commonjs = require("@rollup/plugin-commonjs")
const alias = require('@rollup/plugin-alias')

const resolveFile = function (filePath) {
  return path.join(__dirname, "..", filePath)
}

module.exports = [
  {
    input: resolveFile("src/index.ts"),
    output: {
      file: resolveFile("dist/index.js"),
      format: "iife",
      name: "Monitor",
    },
    // globals: {
    //     lodash: '_'
    // },
    external: [/@babel\/runtime/], // 'lodash-es'
    plugins: [
      // alias({
      //   entries: [
      //     { find: '@', replacement: '../src' },
      //   ]
      // }),
      typescript(),
      nodeResolve(),
      commonjs(),
      
      babel({
        babelrc: false,
        // babelHelpers: 'bundled',
        exclude: "node_modules/**",
        presets: [["@babel/preset-env", { modules: false }]],
        plugins: [
          [
            "@babel/plugin-transform-classes",
            {
              loose: true,
            },
          ],
        ],
      }),
    ],
    
  },
]
