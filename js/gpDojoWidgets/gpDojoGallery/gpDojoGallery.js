/**
 * @author lesgreen
 */
dojo.provide("gp.gpDojoGallery");

dojo.require("dijit._Widget");
//dojo.require("dijit._Templated");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojox.image.Lightbox");


dojo.declare("gp.gpDojoGallery", [ dijit._Widget ], {
	//templatePath: dojo.moduleUrl("im", "templates/thumb_center.html"),
	widgetsInTemplate: true,
	gallery_url: '',
	thumb_position: 'center',
	base_path: '',
	itemMap: {"image_id":"image_id", "thumb_name":'thumb_loc', "thumb_width": "thumb_width", "thumb_height": "thumb_height", "large_name":'large_loc', "large_width": "large_width", "large_height": "large_height", "caption":'caption', "link": "link"},
	thumb_max_height: '',
	thumb_max_width: '',
	thumb_prefix: 'gpDojoGalleryThumb',
	thumb_sizes: 'constant', //various
	large_max_height: '',
	large_max_width: '',
	lightbox_grouping: false,
	picsPerPage: '',
	onImageClick: '', //'{"link": "fromData"}', '{"link": "http://", "param", true}' '{"func": "funcName", "param", true}'
	
	buildRendering: function() {
		this.inherited(arguments);
		if (this.thumb_position == 'center') {
			dojo.create("div", {
				class: "gpGalleryHoverShowPrevBtn",
				id: "gpGalleryPrevBtn"
			}, this.domNode);
			dojo.create("div", {
				class: "gpGalleryThumbWrapper",
				id: "gpGalleryThumbWrapper"
			}, this.domNode);
			dojo.create("div", {
				class: "gpGalleryHoverShowNextBtn",
				id: "gpGalleryNextBtn"
			}, this.domNode);
			
			var tInfo = dojo.position("gpGalleryThumbWrapper", true);
			var ani = dojo.create("div", {
				class: "gpGalleryAnimLoading",
				id: "gpGalleryAnimLoading"
			}, "gpGalleryThumbWrapper");
			var aInfo = dojo.position("gpGalleryAnimLoading", true);
			dojo.style(ani, {
				"marginLeft": (tInfo.w - aInfo.w)/2 + 'px',
				"marginTop": (tInfo.h - aInfo.h)/2 + 'px'
			});
			
		} else if ((this.thumb_position == 'top') || (this.thumb_position == 'bottom')) {
			var t = (this.thumb_position == 'top') ? "gpThumbHoriz" : "gpLargeHoriz";
			var b = (this.thumb_position == 'bottom') ? "gpThumbHoriz" : "gpLargeHoriz";
			var tId = (this.thumb_position == 'top') ? "gpGalleryLayoutThumbs" : "gpGalleryLayoutLarge";
			var bId = (this.thumb_position == 'bottom') ? "gpGalleryLayoutThumbs" : "gpGalleryLayoutLarge";
			dojo.create("div", {
				class: t,
				id: tId
			}, this.domNode);
			dojo.create("div", {
				class: b,
				id: bId
			}, this.domNode);
			dojo.create("div", {
				id: "gpGalleryControlCntnr"
			}, "gpGalleryLayoutThumbs");
			dojo.create("div", {
				class: "gpGalleryPrevBtn",
				id: "gpGalleryPrevBtn"
			}, "gpGalleryControlCntnr");
			dojo.create("div", {
				class: "gpHorizThumbCntnr",
				id: "gpGalleryThumbWrapper"
			}, "gpGalleryControlCntnr");
			dojo.create("div", {
				class: "gpGalleryNextBtn",
				id: "gpGalleryNextBtn"
			}, "gpGalleryControlCntnr");
		} else if ((this.thumb_position == 'left') || (this.thumb_position == 'right')) {
			var l = (this.thumb_position == 'left') ? "gpThumbVert" : "gpLargeVert";
			var r = (this.thumb_position == 'right') ? "gpThumbVert" : "gpLargeVert";
			var lId = (this.thumb_position == 'left') ? "gpGalleryLayoutThumbs" : "gpGalleryLayoutLarge";
			var rId = (this.thumb_position == 'right') ? "gpGalleryLayoutThumbs" : "gpGalleryLayoutLarge";
			dojo.create("div", {
				class: l,
				id: lId
			}, this.domNode);
			dojo.create("div", {
				class: r,
				id: rId
			}, this.domNode);
			dojo.create("div", {
				id: "gpGalleryControlCntnr"
			}, "gpGalleryLayoutThumbs");
			dojo.create("div", {
				class: "gpVertThumbCntnr",
				id: "gpGalleryThumbWrapper"
			}, "gpGalleryControlCntnr");
			dojo.create("div", {
				class: "gpVertNavCntnr",
				id: "gpVertNavCntnr"
			}, "gpGalleryControlCntnr");
			dojo.create("div", {
				class: "gpGalleryPrevBtn",
				id: "gpGalleryPrevBtn"
			}, "gpVertNavCntnr");
			dojo.create("div", {
				class: "gpGalleryNextBtn",
				id: "gpGalleryNextBtn"
			}, "gpVertNavCntnr");
		}
		if (this.thumb_position != 'center') {
			var tInfo = dojo.position("gpGalleryLayoutLarge", true);
			var ani = dojo.create("div", {
				class: "gpGalleryAnimLoading",
				id: "gpGalleryAnimLoading"
			}, "gpGalleryLayoutLarge");
			var aInfo = dojo.position("gpGalleryAnimLoading", true);
			dojo.style(ani, {
				"marginLeft": (tInfo.w - aInfo.w)/2 + 'px',
				"marginTop": (tInfo.h - aInfo.h)/2 + 'px'
			});
		}
    },
		
	postCreate : function() {
		var request = null;
		var numPages = 0;
		var init = false;
		var imageStore = '';
		var outOfItems = false;
		var navHeight = 0;
		var thumbCntnrTop = 0;
		var self = this;
		
		if (!this.itemMap) {
			alert('You must provide an itemMap');
			return;
		}
		if (this.gallery_url) {
			dojo.style(dojo.byId("gpGalleryAnimLoading"), "display", 'block');
			imageStore = new dojo.data.ItemFileReadStore({url: this.gallery_url});
			if (this.picsPerPage) {
				//will add page count later
				//imageStore.fetch({onError: fetchFailed, onComplete: getPageCount});
				request = imageStore.fetch({onBegin: startFetch, onError: fetchFailed, onComplete: initGallery, start: 0, count: this.picsPerPage});
			}  else {
				request = imageStore.fetch({onBegin: startFetch, onError: fetchFailed, onComplete: initGallery});
			}
		} else {
			alert('You must provide a gallery url');
		}
		
		function startFetch() {
			//show Throbber
		}
		
		//will add page count later
		//function getPageCount(items, request) {
		//	numPages = Math.ceil(items.length/self.picsPerPage); 
		//}
		
		function createNav() {
			if (self.thumb_position == 'center') {
				navHeight = dojo.style("gpGalleryPrevBtn", "height");
				thumbCntnrTop = dojo.style("gpGalleryThumbWrapper", "marginTop");
				dojo.style("gpGalleryThumbWrapper", "overflow", "hidden");
				dojo.connect(self.domNode, 'onmouseover', onHover);
				dojo.connect(self.domNode, 'onmouseout', onHoverOut);
			} else {
				dojo.query('#gpGalleryPrevBtn, #gpGalleryNextBtn').style("display", "block");
			}	
			
			dojo.connect(dojo.byId("gpGalleryPrevBtn"), 'onclick', onPrevious);
			dojo.connect(dojo.byId("gpGalleryNextBtn"), 'onclick', onNext);
			return true;
		};
		
		function onHover() {
			dojo.style("gpGalleryPrevBtn", "display", "block");
			dojo.style("gpGalleryNextBtn", "display", "block");
			dojo.style("gpGalleryThumbWrapper", "marginTop", -navHeight+'px');
		};
		
		function onHoverOut() {
			dojo.style("gpGalleryThumbWrapper", "marginTop", thumbCntnrTop+'px');
			dojo.style("gpGalleryPrevBtn", "display", "none");
			dojo.style("gpGalleryNextBtn", "display", "none");
		};
		
		function initGallery(items, request) {
			//hide Throbber
			/*if (!self.picsPerPage) {
				self.picsPerPage = items.length;
			} else {
				outOfItems = (items.length < self.picsPerPage);
			}*/
			if (self.picsPerPage) {
				outOfItems = (items.length < self.picsPerPage);
			}
			createThumbs(items);
		};
		
		function onNext(){
			if(!outOfItems){
		  		request.start += self.picsPerPage;
		    	imageStore.fetch(request);
		  	}
		};
		
		function onPrevious(){
			if (request.start > 0){
		    	request.start -= self.picsPerPage;
		      	imageStore.fetch(request);
		  	}
		};
		
		function createThumbs(items) {
			var tf, div;
			var thumbSize = [];
			if (self.thumb_sizes == 'various') {
				thumbSize = getMaxSize(items);
			}
			dojo.style(dojo.byId("gpGalleryAnimLoading"), "display", 'none');
			var thumbCntnr = dojo.byId("gpGalleryThumbWrapper");
			if (self.thumb_position == 'center') {
				dojo.query("#gpGalleryThumbWrapper .gpGalleryThumbs").forEach(dojo.destroy);
			}
			else {
				thumbCntnr.innerHTML = '';
			}
			var nL = items.length;
			for (var i=0; i<nL; i++) {
				if (thumbSize.length == 0) {
					thumbCntnr.appendChild(createImageLink(items[i], i));
				} else {
					div = dojo.create("div", {
						class: 'gpGalleryThumbs',
						style: {float: 'left',
						width: thumbSize[0] + 'px',
						height: thumbSize[1] + 'px'}
					}, thumbCntnr);
					div.appendChild(createImageLink(items[i], i));
				}
				var node = dojo.byId(self.thumb_prefix + i);
				tf = setImageSize(node, self.thumb_max_width, self.thumb_max_height);
				if (i == 0) {
					if (self.thumb_position != 'center') {
						showLargeImage(items[i]);
					}
				}
			}
			if (!init) {
				if (self.picsPerPage) {
					var tf = createNav();
				}
				if (self.thumb_position != 'center') {
					setThumbCntnrPosition();
				}
				init = true;
			}
		};
		
		function createImageLink(item, imgIndex) {
		 	var _img = dojo.doc.createElement("IMG");
		 	var thumbName = imageStore.getValue(item, self.itemMap.thumb_name);
			var cap = imageStore.getValue(item, self.itemMap.caption);
			cap = (cap) ? cap : thumbName;
			//path prefix added first
			var loc = self.base_path;
			dojo.attr(_img, {
				src: loc+thumbName,
				width: imageStore.getValue(item, self.itemMap.thumb_width),
				height: imageStore.getValue(item, self.itemMap.thumb_height),
				title: cap,
				id: self.thumb_prefix + imgIndex
			});
			var a = dojo.doc.createElement("a");
	
			dojo.addClass(a, 'gpGalleryThumbs');
			a.appendChild(_img);
			if (self.thumb_position == 'center') {
				if (self.onImageClick) {
					var id = imageStore.getValue(item, self.itemMap.image_id);
					if (self.onImageClick.link) {
						if (self.onImageClick.link == "fromData") {
							var ln = imageStore.getValue(item, self.itemMap.link);
						} else {
							var ln = (self.onImageClick.param) ? self.onImageClick.link + id : self.onImageClick.link;  
						}
						dojo.attr(a, "href", ln);
					} else if (self.onImageClick.func) {
						dojo.attr(a, "href", "#");
						var fn = eval(self.onImageClick.func);
						if ((self.onImageClick.param)) {
							dojo.connect(a, 'onclick', function(evt){ fn(id)});
						} else {
							dojo.connect(a, 'onclick', function(evt){ fn()});
						}
					}	
				} else {
					var imgName = imageStore.getValue(item, self.itemMap.large_name);
					var lb = (self.lightbox_grouping) ? new dojox.image.Lightbox({ title:Cap, group:"myGroup", href:loc+imgName }, a) : new dojox.image.Lightbox({ title:cap, href:loc+imgName }, a); 
					lb.startup();
				}
			} else {
				dojo.connect(a, 'onclick', function(evt) { 
					showLargeImage(item);
				});
			}  
			return a;
		};
		
		function showLargeImage(item) {
			//dojo.empty('gpGalleryLayoutLarge');
			dojo.destroy("gpGalleryLargeImage");
			var imgName = imageStore.getValue(item, self.itemMap.large_name);
			var cap = imageStore.getValue(item, self.itemMap.caption);
			cap = (cap) ? cap : imgName;
			var loc = self.base_path;
			dojo.create("img", {
				src: loc+imgName,
				title: cap,
				width: imageStore.getValue(item, self.itemMap.large_width),
				height: imageStore.getValue(item, self.itemMap.large_height),
				id: 'gpGalleryLargeImage',
				style: {float: 'left'}
			}, 'gpGalleryLayoutLarge');
			
			var lg = dojo.byId('gpGalleryLargeImage');
			tf = setImageSize(lg, self.large_max_width, self.large_max_height);
			//dojo.addClass(lg, 'largeBorder');
			var cInfo = dojo.position('gpGalleryLayoutLarge', true);
			var lInfo = dojo.position(lg, true);
			var mL = (cInfo.w - lInfo.w) / 2;
			var mT = (cInfo.h - lInfo.h) / 2;
			dojo.style(lg, {
				marginLeft: mL + "px",
				marginTop: mT + "px"
			});
		};
		
		function setThumbCntnrPosition() {
			if ((self.thumb_position == 'top') || (self.thumb_position == 'bottom')) {
				var cInfo = dojo.position('gpGalleryControlCntnr', true);
				var tInfo = dojo.position('gpGalleryLayoutThumbs', true);
				var mL = (tInfo.w - cInfo.w) / 2;
				var mT = (tInfo.h - cInfo.h) / 2;
				dojo.style('gpGalleryControlCntnr', {
					marginLeft: mL + "px",
					marginTop: mT + "px"
				});
				var pInfo = dojo.position('gpGalleryPrevBtn', true);
				var cInfo = dojo.position('gpGalleryControlCntnr', true);
				mT = (cInfo.h - pInfo.h) / 2;
				dojo.query('#gpGalleryPrevBtn, #gpGalleryNextBtn').style("marginTop", mT + "px");
			} else if ((self.thumb_position == 'right') || (self.thumb_position == 'left')) {
				var cInfo = dojo.position('gpGalleryControlCntnr', true);
				var tInfo = dojo.position(self.domNode, true);
				//var mL = (tInfo.w - cInfo.w) / 2;
				var mT = (tInfo.h - cInfo.h) / 2;
				dojo.style('gpGalleryControlCntnr', {
					marginTop: mT + "px"
				});
			}
		};
		
		function setImageSize(node, maxW, maxH) {
			var w = node.clientWidth;
			var h = node.clientHeight;
			if (maxH) {
				var imgSize = getNewSize(w, h, maxH);
			} else if (maxW) {
				var imgSize = getNewSize(h, w, maxW);
				imgSize.reverse();
			} else {
				var imgSize = new Array(w, h);	
			}
			dojo.attr(node, {
				width: imgSize[0],
				height: imgSize[1]
			});
			return true;
		};
		
		function adjustPhotoSize(nCurSize, nMaxSize) {
			var nPerc = (nCurSize > nMaxSize) ? nMaxSize/nCurSize : 1; 
			return nPerc;
		};
	
		function getNewSize(nW, nH, nMaxSize) {
			var imgSize = new Array();
			var nPerc = adjustPhotoSize(nH, nMaxSize);
			var newH = nH*nPerc;
			var newW = nW*nPerc;
			imgSize.push(newW, newH);
			return imgSize;
		};
		
		function getMaxSize(items) {
			var w = 0, h = 0, wd, ht;
			dojo.forEach(items, function(itm, i) {
				wd = imageStore.getValue(itm, self.itemMap.thumb_width),
				ht = imageStore.getValue(itm, self.itemMap.thumb_height),
				w = (w > wd) ? w : wd;
				h = (h > ht) ? h : ht;
			});
			return [w, h];
		};
		
		//Callback for if the lookup fails.
		function fetchFailed(error, request) {
		   //hide throbber
		   dojo.style(dojo.byId("gpGalleryAnimLoading"), "display", 'none');
		   console.log(error);
		   alert(error);
		};
	}	
	
});