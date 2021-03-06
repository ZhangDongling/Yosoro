import marked from 'marked';
import xss from 'xss';

const defalutProps = [
  'style',
  'title',
  'accesskey',
  'hidden',
  'translate',
  'draggable',
  'dropzone',
  'dir',
  'contenteditable',
  'contextmenu',
  'class',
];
const whiteList = {
  a: [...defalutProps, 'target', 'href', 'title', 'align', 'width', 'height'],
  abbr: ['title'],
  address: ['width', 'height'],
  area: ['shape', 'coords', 'href', 'alt'],
  article: ['width', 'height'],
  aside: ['width', 'height'],
  audio: ['autoplay', 'controls', 'loop', 'preload', 'src'],
  b: [],
  bdi: ['dir'],
  bdo: ['dir'],
  big: [],
  blockquote: ['cite'],
  br: [],
  caption: [],
  center: [],
  cite: [],
  code: [],
  col: ['align', 'valign', 'span', 'width'],
  colgroup: ['align', 'valign', 'span', 'width'],
  dd: [],
  del: ['datetime'],
  details: ['open'],
  div: [...defalutProps, 'align'],
  dl: [],
  dt: [],
  em: [],
  font: ['color', 'size', 'face'],
  footer: [...defalutProps, 'align'],
  h1: [...defalutProps, 'align'],
  h2: [...defalutProps, 'align'],
  h3: [...defalutProps, 'align'],
  h4: [...defalutProps, 'align'],
  h5: [...defalutProps, 'align'],
  h6: [...defalutProps, 'align'],
  header: [...defalutProps, 'align'],
  hr: [],
  i: [],
  img: ['src', 'alt', 'title', 'width', 'height'],
  ins: ['datetime'],
  li: [...defalutProps, 'align'],
  mark: [],
  nav: [...defalutProps, 'align'],
  ol: [...defalutProps, 'align'],
  p: [...defalutProps, 'align'],
  pre: [],
  s: [],
  section: [...defalutProps, 'align'],
  small: [],
  span: ['width', 'height'],
  sub: [],
  sup: [],
  strong: [],
  table: ['width', 'border', 'align', 'valign'],
  tbody: ['align', 'valign'],
  td: ['width', 'rowspan', 'colspan', 'align', 'valign'],
  tfoot: ['align', 'valign'],
  th: ['width', 'rowspan', 'colspan', 'align', 'valign'],
  thead: ['align', 'valign'],
  tr: ['rowspan', 'align', 'valign'],
  tt: [],
  u: [],
  ul: [...defalutProps, 'align'],
  video: ['autoplay', 'controls', 'loop', 'preload', 'src', 'height', 'width'],
  input: ['class', 'checked', 'disabled', 'type'],
};

const htmlXss = new xss.FilterXSS({
  whiteList,
  css: false, // 不实用css过滤器
  allowCommentTag: false,
  stripIgnoreTagBody: false,
  stripIgnoreTag: false,
});

const renderer = new marked.Renderer();

renderer.listitem = function (text) {
  let res = text;
  if (/^\s*\[[x ]\]\s*/.test(text)) {
    res = text.replace(/^\s*\[ \]\s*/, '<input class="task-list-item-checkbox" type="checkbox" disabled></input> ').replace(/^\s*\[x\]\s*/, '<input class="task-list-item-checkbox" checked disabled type="checkbox"></input> ');
    return `<li class="task-list-li">${res}</li>`;
  }
  return `<li>${text}</li>`;
};

marked.setOptions({
  renderer,
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  highlight: (code) => {
    const value = require('./highlight.min.js').highlightAuto(code).value;
    return value;
  },
});

function formatNumber(number) {
  if (number < 10) {
    return `0${number}`;
  }
  return number;
}


export function formatDate(date) {
  const newDate = new Date(date);
  const year = newDate.getFullYear();
  const month = formatNumber(newDate.getMonth() + 1);
  const day = formatNumber(newDate.getDate());
  const hour = formatNumber(newDate.getHours());
  const minutes = formatNumber(newDate.getMinutes());
  const seconds = formatNumber(newDate.getSeconds());
  return `${year}-${month}-${day}  ${hour}:${minutes}:${seconds}`;
}

/**
 * @param 将组件state存放至localStroge中
 * @param {String} componentName - 组件displayName
 * @param {Object} state - 组件state
 */
export function pushStateToStorage(componentName, state) {
  // const data = JSON.stringify(state);
  window.localStorage.setItem(componentName, JSON.stringify(state));
}

/**
 * @description 从localStorage中读取组件state与初始state合并
 * @param {String} componentName - 组件displayName
 * @param {Object} initState - 组件初始state
 */
export function mergeStateFromStorage(componentName, initState) {
  const str = window.localStorage.getItem(componentName);
  let obj;
  if (str) {
    obj = JSON.parse(str);
  } else {
    obj = {};
  }
  return Object.assign({}, initState, obj);
}

function formatVersion(string) {
  const version = string.replace(/\.|v|-beta/ig, '');
  return parseInt(version, 10);
}

/**
 * @desc 比较本地版本号与线上最新版本号
 * @param {String} localVersion 本地版本
 * @param {String} latestVersion 线上版本
 *
 * @return {Boolean} flag 是否需要更新
 */
export function compareVersion(localVersion, latestVersion) {
  if (localVersion === latestVersion) { // 不需要更新
    return false;
  }
  let localBeta = false;
  let latestBeta = false;
  if (/-beta/ig.test(localVersion)) {
    localBeta = true;
  }
  if (/-beta/ig.test(latestVersion)) {
    latestBeta = true;
  }
  const localFormatVersion = formatVersion(localVersion);
  const latestFormatVersion = formatVersion(latestVersion);
  if (localFormatVersion === latestFormatVersion && localBeta && !latestBeta) { // 本地是测试版本
    return true;
  }
  if (localFormatVersion === latestFormatVersion && !localBeta && latestBeta) { // 线上是测试版本
    return false;
  }
  if (localFormatVersion >= latestFormatVersion) {
    return false;
  }
  if (localFormatVersion < latestFormatVersion) {
    return true;
  }
  return false;
}

/**
 * @desc markdown to html
 *
 * @export
 * @param {any} string markdown内容
 * @param {boolean} [xssWhite=false] 是否阻止xss
 * @returns html
 */
export function markedToHtml(string, xssWhite = true) {
  const html = marked(string);
  if (xssWhite) {
    return htmlXss.process(html);
  }
  return html;
  // return marked(string);
}


/**
 * @desc 函数节流 返回函数连续调用时，fun 执行频率限定为 次/wait
 *
 * @param {Function} func 需要执行的函数
 * @param {Number} wait 执行间隔，单位是毫秒（ms），默认100
 *
 * @return {Function} 返回一个“节流”函数
 */
export function throttle(func, wait = 100) {
  let timer = null;
  let previous; // 上次执行时间
  return function (...args) { // 闭包
    const context = this;
    const currentArgs = args;
    const now = +new Date();

    if (previous && now < previous + wait) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        previous = now;
        func.apply(context, currentArgs);
      }, wait);
    } else {
      previous = now;
      func.apply(context, currentArgs);
    }
  };
}

/**
 * @desc 函数防抖
 * @param {Function} fn 需要执行的函数
 * @param {Number} delay 执行间隔，单位是毫秒（ms），默认100
 *
 * @return {Function}
 */
export function debounce(fn, delay = 100) {
  let timer;
  return function (...args) {
    const context = this;
    const currentArgs = args;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, currentArgs);
    }, delay);
  };
}

/**
 * @desc 获取组件displayName
 * @param {React.Component} WrappedComponent React组件
 */
export function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName ||
         WrappedComponent.name ||
         'Component';
}
