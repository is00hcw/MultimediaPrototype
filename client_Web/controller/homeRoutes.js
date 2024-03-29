/**
 * Created by bian17888 on 15/10/20.
 */
var render = require('../module/render');
var parse = require('co-body');
var utils = require('../module/utils');
var config = require('../conf/config.js');
var querystring = require('querystring');

var superagent = require('superagent');

/* 首页 */
function *home() {

	var path = this.request.path;       // path '/' -> 首页; path '/myvideo' -> 我上传的视频页
	// 第一次请求页面
	// tolight : 此处如果用 yield parse(this), 需要做异常处理
	var isFirstView = this.request.query.pageNumber;
	var isLogined = Boolean(this.session.username);

	// 用户未登录 && 上传的视频页 , 跳转到登录页面
	if (!isLogined && (path === '/myvideo') ) return this.redirect('/login')

	// 初始状态, 无 pageNumber
	if (!isFirstView) {
		var res = yield utils._request('get', '/admin/api/video/list?status=1&pageSize=10' + '&self=0', null);
		var len = res.body.data.count;
		
		// 为分页功能赋默认值
		res.body.pageNumber = 1;
		res.body.totalPage = Math.ceil(len / 10);
	} else {
		var data = this.request.query;
		var res = yield utils._request('get', '/admin/api/video/list?status=1&pageSize=10&pageNumber=' + data.pageNumber + '&self=0', null)
		var len = res.body.data.count;
		// 从 swig 模板获取分页参数
		res.body.pageNumber = data.pageNumber;
		res.body.totalPage = Math.ceil(len / 10);
	}

	// tofix : 通过 session, 解决登录登出 -> 稍后后端返回
	res.body.session = this.session;
	// swig 模板跨服务器获取资源
	res.body.domain = config.server.domain;
	res.body.port = config.server.port;
	this.status = 200;
	this.body = yield render('home', res.body);

}

/* 上传页 */
function *showUpload(id) {
	// tofix : 通过 session, 解决登录登出 -> 稍后后端返回
	var session = this.session;
	var res = {
		body: {
			session: session
		}
	}
	// 如果用户未登录, 跳转到登录页面
	if (!session.username) return this.redirect('/login')
	// swig 模板跨服务器获取资源
	res.body.domain = config.server.domain;
	res.body.port = config.server.port;
	this.status = 200;
	this.body = yield render('upload', res.body);
}

/* 上传表单 */
function *upload() {
}

/* 视频播放页 */
function *video(id) {
	var res = yield utils._request('get', '/admin/api/video/get/' + id, null)
	// tofix : 通过 session, 解决登录登出 -> 稍后后端返回
	res.body.session = this.session;

	// swig 模板跨服务器获取资源
	res.body.domain = config.server.domain;
	res.body.port = config.server.port;

	this.body = yield render('video', res.body);
}

/* 删除视频 */
function *delVideo() {

	var cookie = this.cookies.get('JSESSIONID');
	var cookieStr = 'JSESSIONID=' + cookie;

	var res = yield utils._requestCookie(this.url, cookieStr)

	// tofix : 临时数据, code : 0 -> 成功, 1失败
	//var data = { "code" : 1}

	this.status = 200;
	//this.body = data;
	this.body = res.body;
}

/* 我上传的视频 */
function *myVideo (){

	// 第一次请求页面
	var isFirstView = this.request.query.pageNumber;
	var isLogined = Boolean(this.session.username);
	var cookie = this.cookies.get('JSESSIONID');
	var cookieStr = 'JSESSIONID=' + cookie;

	// 用户未登录 && 上传的视频页 , 跳转到登录页面
	if (!isLogined) return this.redirect('/login')

	// 初始状态, 无 pageNumber
	if (!isFirstView) {
		var res = yield utils._requestCookie('/admin/api/video/listMyVideo?&pageSize=10', cookieStr);
		var len = res.body.data.count;

		// 为分页功能赋默认值
		res.body.pageNumber = 1;
		res.body.totalPage = Math.ceil(len / 10);
	} else {
		var data = this.request.query;
		var res = yield utils._requestCookie('/admin/api/video/listMyVideo?&pageSize=10&pageNumber=' + data.pageNumber, cookieStr)
		var len = res.body.data.count;
		// 从 swig 模板获取分页参数
		res.body.pageNumber = data.pageNumber;
		res.body.totalPage = Math.ceil(len / 10);
	}

	// tofix : 通过 session, 解决登录登出 -> 稍后后端返回
	res.body.session = this.session;
	// swig 模板跨服务器获取资源
	res.body.domain = config.server.domain;
	res.body.port = config.server.port;
	this.status = 200;
	this.body = yield render('myvideo', res.body);

}

module.exports = {
	home      : home,
	showUpload: showUpload,
	video     : video,
	upload    : upload,
	delVideo  : delVideo,
	myVideo : myVideo
}



