// @ts-check

const path = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const purgecss = require('@fullhuman/postcss-purgecss')


const root = path.resolve(__dirname, '..')

/** @type { import('webpack').Configuration } */
module.exports = {

  mode: 'production',
  
  devtool: 'source-map',

  entry: path.resolve(root, 'src', 'main.js'),

  output: {
    publicPath: '/dist/',
    path: path.resolve(root, 'dist'),
    filename: 'main.js',
  },

  resolve: {
    modules: ['src', 'node_modules'],
    alias: {
      svelte: path.resolve('node_modules', 'svelte'),
    },
    extensions: ['.ts', 'mjs', '.js', '.pcss', '.svelte'],
    mainFields: ['browser', 'module', 'main'],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          
        }
      },
      {
        test: /\.mjs$/,
        type: 'javascript/auto',
      },
      {
        test: /\.svelte$/,
        exclude: /node_modules/,
        loader: 'svelte-loader',
        options: {
          dev: false,
          emitCss: true,
        },
      },
      {
        test: /\.p?css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { 
              url: false,
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [
                require('tailwindcss'),
                require('autoprefixer'),
              ],
            },
          },
        ],
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: 'main.css',
    })
  ],

}