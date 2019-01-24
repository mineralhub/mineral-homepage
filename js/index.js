$(document).ready(function () {

    AOS.init(); // [aos.css] 스크롤 시 나타나는 애니메이션 셋팅

    transLanguage(); // 언어 변경

    scrollNav(); // 스크롤 하는 Nav

    transHeader(); // 스크롤, 마우스휠에 따라 Header 애니메이션 (없어도 됨)

    swiperSlider(); // swiper 슬라이더 셋팅

    $(".scrollTop").scrollToTop(500); // [jquery.nav.js] 스크롤 Top 셋팅

    $("#tabs").tabs({ // jquery ui tabs hover 셋팅
        event: "mouseover"
    });

    $("#mobileTabs").accordion();

    cardFlip(); // PC, Mobile 에 따라 각기 다른 이벤트로 Card Flip

    // Card Flip 지원하는 최신 엔진이냐 아니냐를 체크하고 Card Flip 연출할지
    // 노멀하게 연출할지 체크
    if( whatKindOfBrowser() == "chrome" ||
        whatKindOfBrowser() == "firefox" ||
        whatKindOfBrowser() == "opera") {
      console.log("크롬 or FF or 오페라 입니다.");
    } else {
      console.log("Card Flip 지원하지 않는 브라우저 입니다.");
    }



    // 모바일이면 처음 들어왔을 때의 브라우저 높이로 main 높이 셋팅
    // 모바일 브라우저의 innerHeight 은 유저의 스크롤에 따라서 계속 변함.
    if(window.innerWidth <= 767) { // 모바일 체크
      $(".main").css("height", window.innerHeight);
    }







    // 메인 fog 효과 연출 Three.js
    // ------------------------------------------------------------------------
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var debounce = function debounce(callback, duration) {
      var timer;
      return function (event) {
        clearTimeout(timer);
        timer = setTimeout(function () {
          callback(event);
        }, duration);
      };
    };

    var loadTexs = function loadTexs(imgs, callback) {
      var texLoader = new THREE.TextureLoader();
      var length = Object.keys(imgs).length;
      var loadedTexs = {};
      var count = 0;

      texLoader.crossOrigin = 'anonymous';

      var _loop = function _loop() {
        var k = key;
        if (imgs.hasOwnProperty(k)) {
          texLoader.load(imgs[k], function (tex) {
            tex.repeat = THREE.RepeatWrapping;
            loadedTexs[k] = tex;
            count++;
            if (count >= length) callback(loadedTexs);
          });
        }
      };

      for (var key in imgs) {
        _loop();
      }
    };

    var Fog = function () {
      function Fog() {
        _classCallCheck(this, Fog);

        this.uniforms = {
          time: {
            type: 'f',
            value: 0
          },
          tex: {
            type: 't',
            value: null
          }
        };
        this.num = 80;
        this.obj = null;
      }

      _createClass(Fog, [{
        key: 'createObj',
        value: function createObj(tex) {
          // Define Geometries
          var geometry = new THREE.InstancedBufferGeometry();
          var baseGeometry = new THREE.PlaneBufferGeometry(800, 800, 20, 20);

          // Copy attributes of the base Geometry to the instancing Geometry
          geometry.addAttribute('position', baseGeometry.attributes.position);
          geometry.addAttribute('normal', baseGeometry.attributes.normal);
          geometry.addAttribute('uv', baseGeometry.attributes.uv);
          geometry.setIndex(baseGeometry.index);

          // Define attributes of the instancing geometry
          var instancePositions = new THREE.InstancedBufferAttribute(new Float32Array(this.num * 3), 3, 1);
          var delays = new THREE.InstancedBufferAttribute(new Float32Array(this.num), 1, 1);
          var rotates = new THREE.InstancedBufferAttribute(new Float32Array(this.num), 1, 1);
          for (var i = 0, ul = this.num; i < ul; i++) {
            instancePositions.setXYZ(i, (Math.random() * 2 - 1) * 850, 0, (Math.random() * 2 - 1) * 500);
            delays.setXYZ(i, Math.random());
            rotates.setXYZ(i, Math.random() * 2 + 1);
          }
          geometry.addAttribute('instancePosition', instancePositions);
          geometry.addAttribute('delay', delays);
          geometry.addAttribute('rotate', rotates);

          // Define Material
          var material = new THREE.RawShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: '\n        attribute vec3 position;\n        attribute vec2 uv;\n        attribute vec3 instancePosition;\n        attribute float delay;\n        attribute float rotate;\n\n        uniform mat4 projectionMatrix;\n        uniform mat4 modelViewMatrix;\n        uniform float time;\n\n        varying vec3 vPosition;\n        varying vec2 vUv;\n        varying vec3 vColor;\n        varying float vBlink;\n\n        const float duration = 200.0;\n\n        mat4 calcRotateMat4Z(float radian) {\n          return mat4(\n            cos(radian), -sin(radian), 0.0, 0.0,\n            sin(radian), cos(radian), 0.0, 0.0,\n            0.0, 0.0, 1.0, 0.0,\n            0.0, 0.0, 0.0, 1.0\n          );\n        }\n        vec3 convertHsvToRgb(vec3 c) {\n          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n        }\n\n        void main(void) {\n          float now = mod(time + delay * duration, duration) / duration;\n\n          mat4 rotateMat = calcRotateMat4Z(radians(rotate * 360.0) + time * 0.1);\n          vec3 rotatePosition = (rotateMat * vec4(position, 1.0)).xyz;\n\n          vec3 moveRise = vec3(\n            (now * 2.0 - 1.0) * (2500.0 - (delay * 2.0 - 1.0) * 2000.0),\n            (now * 2.0 - 1.0) * 2000.0,\n            sin(radians(time * 50.0 + delay + length(position))) * 30.0\n            );\n          vec3 updatePosition = instancePosition + moveRise + rotatePosition;\n\n          vec3 hsv = vec3(time * 0.1 + delay * 0.2 + length(instancePosition) * 100.0, 0.5 , 0.8);\n          vec3 rgb = convertHsvToRgb(hsv);\n          float blink = (sin(radians(now * 360.0 * 20.0)) + 1.0) * 0.88;\n\n          vec4 mvPosition = modelViewMatrix * vec4(updatePosition, 1.0);\n\n          vPosition = position;\n          vUv = uv;\n          vColor = rgb;\n          vBlink = blink;\n\n          gl_Position = projectionMatrix * mvPosition;\n        }\n      ',
            fragmentShader: '\n        precision highp float;\n\n        uniform sampler2D tex;\n\n        varying vec3 vPosition;\n        varying vec2 vUv;\n        varying vec3 vColor;\n        varying float vBlink;\n\n        void main() {\n          vec2 p = vUv * 2.0 - 1.0;\n\n          vec4 texColor = texture2D(tex, vUv);\n          vec3 color = (texColor.rgb - vBlink * length(p) * 0.8) * vColor;\n          float opacity = texColor.a * 0.36;\n\n          gl_FragColor = vec4(color, opacity);\n        }\n      ',
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
          });
          this.uniforms.tex.value = tex;

          // Create Object3D
          this.obj = new THREE.Mesh(geometry, material);
        }
      }, {
        key: 'render',
        value: function render(time) {
          this.uniforms.time.value += time;
        }
      }]);

      return Fog;
    }();

    var resolution = new THREE.Vector2();
    var canvas = document.getElementById('fog');
    var renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvas
    });
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera();
    var clock = new THREE.Clock();

    camera.far = 50000;
    camera.setFocalLength(24);

    var texsSrc = {
      fog: 'https://ykob.github.io/sketch-threejs/img/sketch/fog/fog.png'
    };
    var fog = new Fog();

    var render = function render() {
      var time = clock.getDelta();
      fog.render(time);
      renderer.render(scene, camera);
    };
    var renderLoop = function renderLoop() {
      render();
      requestAnimationFrame(renderLoop);
    };
    var resizeCamera = function resizeCamera() {
      camera.aspect = resolution.x / resolution.y;
      camera.updateProjectionMatrix();
    };
    var resizeWindow = function resizeWindow() {
      resolution.set(window.innerWidth, window.innerHeight);
      canvas.width = resolution.x;
      canvas.height = resolution.y;
      resizeCamera();
      renderer.setSize(resolution.x, resolution.y);
    };
    var on = function on() {
      window.addEventListener('resize', debounce(resizeWindow), 1000);
    };

    var init = function init() {
      loadTexs(texsSrc, function (loadedTexs) {
        fog.createObj(loadedTexs.fog);

        scene.add(fog.obj);

        renderer.setClearColor(0x111111, 0.0);
        camera.position.set(0, 0, 1000);
        camera.lookAt(new THREE.Vector3());
        clock.start();

        on();
        resizeWindow();
        renderLoop();
      });
    };
    init();
    // ------------------------------------------------------------------------
});







$(window).on("load", function() { // 모든 이미지 리소스 까지 다 로딩하고 난 후에 호출
    // --------------------------------- 로드 암막
    var loadDiv = document.getElementById("load");
    var loadOpacitySpeed = 0.02;
    var loadOpacity = 1;
    var loadOpacityStr = "1";

    var loadInterval;

    function load() {
    loadOpacity -= loadOpacitySpeed;
    loadOpacityStr = loadOpacity.toString();
    loadDiv.style.opacity = loadOpacityStr;

        if(loadDiv.style.opacity < 0) {
          loadDiv.style.display = "none";
          clearInterval(loadInterval);
        }
    }


    loadInterval = setInterval(load, 15); // 로드 암막
    // --------------------------------- 로드 암막

});


function transLanguage() {
    var nowLanguage = "한국어"; // 기본 값 셋팅
    var nowLang;

    $(".nowLanguage").html(nowLanguage); // 기본 값 랜더링
    nowLang = ko;

    $(".languageList .list li").on("click", function (e) { // 카테고리 클리 시

        $(".tl").css("transition-duration", "0s");
        $(".tl").css("opacity", "0"); // 일단 바뀌는 모든 텍스트들 숨김

        nowLanguage = e.target.innerHTML;

        switch (nowLanguage) {
            case "한국어":
                nowLang = ko;
                break;
            case "ENGLISH":
                nowLang = en;
                break;
            case "简体中文":
                nowLang = zh;
                break;
        }

        $(".languageList .list").css("height", "0px"); // 언어 리스트 닫기
        $(".languageList .arrow").css("display", "none"); // 언어 리스트 닫기


        // --- HTML <script/> 태그에 반복문으로 텍스트 커스텀 함수 만들어서 바로 실행하여 랜더링 ---
        var langScript; // <script/> 태그에 넣을 함수를 문자열로 저장하는 변수
        var langString; // 선택된 언어의 객체를 짧은 문자열로 저장

        switch (nowLang) { // 선택된 언어의 객체를 짧은 문자열로 저장
            case ko:
                langString = 'ko';
                break;
            case en:
                langString = 'en';
                break;
            case zh:
                langString = 'zh';
                break;
        }


        $('head title').html(nowLang.title); // 반복될 필요 없는 Title 은 위로 뺌
        console.log(langString + nowLang.title); // 테스트용 언어 전환

        $('[class^=tl]').each(function () { // 해당 클래스가 검색되면 반복

            langScript = "<script>\n" +
                "function languageRender() {\n" +
                "$('#" + $(this).attr("id") + "').html(" + langString + "." + $(this).attr("id") + ");\n" +
                "}\n" +
                "</script>";

            $(".langScript").html(langScript); // 위에 작성된 함수를 .langScript 에 넣기

            languageRender(); // .langScript 에 넣어진 함수 실행
            console.log(langScript); // 테스트용 한줄씩 실행
        });

        // ------------------------------------------


        $(".nowLanguage").html(nowLanguage); //  현재 언어 표시되는 부분에 현재 언어 표시

        setTimeout(function() { // 바뀐 텍스트들 Fade in
            $(".tl").css("transition-duration", "0.7s");
            $(".tl").css("opacity", "1");
        }, 200);


    });

    $(".country").on("mouseover", function() { // 언어 리스트 열기
        $(".languageList .list").css("height", "105px");
        $(".languageList .arrow").css("display", "block");
    });
    $(".country").on("mouseleave", function() { // 언어 리스트 닫기
        $(".languageList .list").css("height", "0px");
        $(".languageList .arrow").css("display", "none");
    });
}

function transLanguageMobile(langValue) {
    var nowLanguage = "KO"; // 기본 값 셋팅
    var nowLang;

    $(".tl").css("transition-duration", "0s");
    $(".tl").css("opacity", "0"); // 일단 바뀌는 모든 텍스트들 숨김

    nowLanguage = langValue;

    switch (nowLanguage) {
        case "한국어":
            nowLang = ko;
            break;
        case "ENGLISH":
            nowLang = en;
            break;
        case "简体中文":
            nowLang = zh;
            break;
    }

    // --- HTML <script/> 태그에 반복문으로 텍스트 커스텀 함수 만들어서 바로 실행하여 랜더링 ---
    var langScript; // <script/> 태그에 넣을 함수를 문자열로 저장하는 변수
    var langString; // 선택된 언어의 객체를 짧은 문자열로 저장

    switch (nowLang) { // 선택된 언어의 객체를 짧은 문자열로 저장
        case ko:
            langString = 'ko';
            break;
        case en:
            langString = 'en';
            break;
        case zh:
            langString = 'zh';
            break;
    }


    $('head title').html(nowLang.title); // 반복될 필요 없는 Title 은 위로 뺌
    console.log(langString + nowLang.title); // 테스트용 언어 전환

    $('[class^=tl]').each(function () { // 해당 클래스가 검색되면 반복

        langScript = "<script>\n" +
            "function languageRender() {\n" +
            "$('#" + $(this).attr("id") + "').html(" + langString + "." + $(this).attr("id") + ");\n" +
            "}\n" +
            "</script>";

        $(".langScript").html(langScript); // 위에 작성된 함수를 .langScript 에 넣기

        languageRender(); // .langScript 에 넣어진 함수 실행
        console.log(langScript); // 테스트용 한줄씩 실행
    });

    // ------------------------------------------
    $("#sec2_goGitHub").html($("#sec2_goGitHub").html().replace("Visit the Mineral Hub GitHub", "Visit the GitHub"));

    $(".nowLanguage").html(nowLanguage); //  현재 언어 표시되는 부분에 현재 언어 표시

    setTimeout(function() { // 바뀐 텍스트들 Fade in
        $(".tl").css("transition-duration", "0.7s");
        $(".tl").css("opacity", "1");
    }, 200);


}

function scrollNav() {
    $('.nav .menu').onePageNav({ // [jquery.nav.js] 스크롤, Nav 셋팅
        currentClass: 'on',
        changeHash: false,
        scrollSpeed: 500,
        scrollThreshold: 0.5,
        filter: '',
        easing: 'swing',
        begin: function () {
            //I get fired when the animation is starting
        },
        end: function () {
            //I get fired when the animation is ending
        },
        scrollChange: function ($currentListItem) {
            //I get fired when you enter a section and I pass the list item of the section
        }
    });

    $('.mobileNav').onePageNav({ // [jquery.nav.js] 스크롤, Nav 모바일 셋팅
        currentClass: 'on',
        changeHash: false,
        scrollSpeed: 500,
        scrollThreshold: 0.5,
        filter: '',
        easing: 'swing',
        begin: function () {
            //I get fired when the animation is starting
        },
        end: function () {
            //I get fired when the animation is ending
        },
        scrollChange: function ($currentListItem) {
            //I get fired when you enter a section and I pass the list item of the section
        }
    });
}

function transHeader() {
    var temp1; // 전 스크롤 위치 저장
    var temp2; // 후 스크롤 위치 저장

    $(window).scroll(function () { // Header 위에 있으면 투명도 1
      var i = 1;

      if ($(window).scrollTop() < 150) {
          $("header").css("background", "none");
          $("header").css("-moz-box-shadow", "5px 5px 10px rgba(0, 0, 0, 0)");
          $("header").css("-webkit-box-shadow", "5px 5px 10px rgba(0, 0, 0, 0)");
          $("header").css("box-shadow", "5px 5px 10px rgba(0, 0, 0, 0)");
          $("header .headerBottom .nav .logo > a").css("background-image", "url('image/mainLogo.png')");
          $("header .headerBottom .nav .menu > li > a").css("color", "#ffffff");
          $("header .headerTop .snsNav .country > h5 > span").css("color", "#ffffff");

          for(i = 1 ; i <= 7 ; i++) { // sns 버튼들 아이콘을 백그라운드 이미지로 매핑
            $("header .headerTop .snsNav .menu > .sns" + i).css("background-image", "url('image/headerSns" + i + ".png')");


            // Mobile header
            $(".mobileHeader .wrap").removeClass("scrolling");
          }
      } else {
          $("header").css("background", "#ffffff");
          $("header").css("-moz-box-shadow", "5px 5px 10px rgba(0, 0, 0, 0.2)");
          $("header").css("-webkit-box-shadow", "5px 5px 10px rgba(0, 0, 0, 0.2)");
          $("header").css("box-shadow", "5px 5px 10px rgba(0, 0, 0, 0.2)");
          $("header .headerBottom .nav .logo > a").css("background-image", "url('image/mainLogo_scroll.png')");
          $("header .headerBottom .nav .menu > li > a").css("color", "#000000");
          $("header .headerTop .snsNav .country > h5 > span").css("color", "#000000");

          for(i = 1 ; i <= 7 ; i++) { // sns 버튼들 아이콘을 백그라운드 이미지로 매핑
            $("header .headerTop .snsNav .menu > .sns" + i).css("background-image", "url('image/headerSns" + i + "_scroll.png')");
          }


          // Mobile header
          $(".mobileHeader .wrap").addClass("scrolling");
      }

        temp1 = $(window).scrollTop(); // 스크롤 발생 시 그 시점 위치 저장

        if (temp1 < temp2) { // 스크롤이 올라갔을 때
        } else { // 스크롤이 내려갔을 때
        }

        temp2 = $(window).scrollTop(); // 스크롤 발생 후의 위치 저장
    });
}

function swiperSlider() {
    var swiper = new Swiper('.swiper-container', { // swiper 슬라이드 셋팅
        slidesPerView: 3,
        spaceBetween: 30,
        slidesPerGroup: 3,
        loop: true,
        loopFillGroupWithBlank: true,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {// 반응형
            1080: { // 테블릿
                slidesPerView: 2,
                slidesPerGroup: 2
            },
            768: {  // 모바일
                slidesPerView: 1,
                slidesPerGroup: 1
            }
        }
    });
}


var menuOn = false;

function mobileMenu() { // 모바일 메뉴 토글 함수

  if (menuOn) {
    $(".mobileHeader .menu").css("left", "-100%");
    setTimeout(function() {
      $(".dark").css("display", "none");
    }, 500);
    $(".dark").css("opacity", "0");
    menuOn = false;
  } else {
    $(".mobileHeader .menu").css("left", "0px");
    $(".dark").css("display", "block");
    setTimeout(function() {
      $(".dark").css("opacity", "0");
      $(".dark").css("opacity", "0.4");
    }, 10);
    $(".mobileHeader .wrap").addClass("scrolling");
    menuOn = true;
  }
}

function cardFlip(e) {

    // PC 는 마우스오버, 마우스리브 이벤트
    $(".flipCard").on("mouseover", function() {
      if(window.innerWidth > 1024) { // PC 체크
        $(this).children(".flipCardInner").css('transform', 'rotateY(180deg)');
      }
    });
    $(".flipCard").on("mouseleave", function() {
      if(window.innerWidth > 1024) { // PC 체크
        $(this).children(".flipCardInner").css('transform', 'rotateY(0deg)');
      }
    });

    // 모바일은 클릭 이벤트
    $(".flipCard").on("click", function() {
      if(window.innerWidth <= 1024) { // 모바일 체크
        if($(this).children(".flipCardInner").hasClass("flipped")) {
          $(this).children(".flipCardInner").css('transform', 'rotateY(0deg)').removeClass("flipped");
        }
        else {
          $(this).children(".flipCardInner").css('transform', 'rotateY(180deg)').addClass("flipped");
        }
      }
    });
}



var Browser = {
    a : navigator.userAgent.toLowerCase()
};

Browser = {
    ie : /*@cc_on true || @*/ false,
    ie6 : Browser.a.indexOf('msie 6') != -1,
    ie7 : Browser.a.indexOf('msie 7') != -1,
    ie8 : Browser.a.indexOf('msie 8') != -1,
    opera : !!window.opera,
    safari : Browser.a.indexOf('safari') != -1,
    safari3 : Browser.a.indexOf('applewebkit/5') != -1,
    mac : Browser.a.indexOf('mac') != -1,
    chrome : Browser.a.indexOf('chrome') != -1,
    firefox : Browser.a.indexOf('firefox') != -1
};

function whatKindOfBrowser() {
	if (Browser.chrome) {
		return "chrome";
	} else if (Browser.ie6) {
		return "ie6";
	} else if (Browser.ie7) {
		return "ie7";
	} else if (Browser.ie8) {
		return "ie8";
	} else if (Browser.opera) {
		return "opera";
	} else if (Browser.safari) {
		return "safari";
	} else if (Browser.safari3) {
		return "safari";
	} else if (Browser.mac) {
		return "mac";
	} else if (Browser.firefox) {
		return "firefox";
	} else {
		return "maybeIe";
	}
}
