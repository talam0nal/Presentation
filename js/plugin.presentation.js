/*
Present - плагин для показа презентаций

Подключите jQuery, plugin.presentation.js и plugin.presentation.css

Слайды задаются как массив js-объектов, например:

[
        {
          src: 'http://s5.goodfon.ru/image/206658-1920x1200.jpg',
          showHint: true,
          backgroundCss: '#FF0000',
          type: 'actualSize'
        },
        {
          src: 'img/1.png',
          showHint: false,
          backgroundCss: '-webkit-linear-gradient(top, #2F2727, #1a82f7)',
          type: 'fit'
        },
        {
          src: 'http://www.youtube.com/embed/HVMAv_dT8FE',
          showHint: true,
          backgroundCss: '#FFFFFF',
          type: 'video'
        },
        {
          src: 'http://s3.goodfon.ru/image/207824-640x480.jpg',
          showHint: true,
          backgroundCss: '#000000',
          type: 'fillWidth'
        }
      ];
Где type - тип слайда:

    actualSize  - изображение оригинального размера, прижато к верхнему краю и отцентровано
    fit         - изображение вписано в окно и отцентровано по горизонтали или вертикали
    fillWidth   - изображение растянуто по ширине окна и прижато к верхнему краю
    video       - видео в iframe, растянутом на все окно
    src         - ссылка на содержимое слайда

showHint - показывать ли кнопку, по которой можно перейти к следующему слайду (true/false)

backgroundCss - CSS-свойство для фона слайда

Презентация запускается вызовом $('.selector').present(slides);

Если slides не заданы, то будет попытка распарсить значение rel селектора как json.

Структура html для работы презентации:


<div class="presentation-container" rel=''>
  <div class="preloader">
    <div class="preloader-text">
      Загружено <span id="slidesLoaded">0</span> из <span id="totalSlides">0</span>...
    </div>
  </div>
  <div id="next-slide">
    Щелкните для перехода к следующему слайду
  </div>
  <div id="presentation-slides" class="slides">

  </div>
</div>
 *
 */

$.fn.present = function(parameters) {
	var slides = null;
	if (typeof parameters !== 'undefined') {
		var slides = parameters;
	} else {
		var slides = JSON.parse(this.attr('rel'));
	}

  $('#totalSlides').text(slides.length);

	$('#next-slide, .presentation-container').on('click', function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if ($(':animated').length == 0) {
      nextSlide();
    }
  });

  $('.presentation-container').on('swipe', function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if ($(':animated').length == 0) {
      nextSlide();
    }
  });

  $(window).on('resize', function() {
    if (currentSlide >= 0 && (currentSlide < slides.length)) {
      positionSlide(slides[currentSlide], nthSlide(currentSlide));           
    }
  });

      
  var currentSlide = -1;
  var slidesLoaded = false;
  var slidesLoadedCount = 0;
  var animationShowDuration = 1000;
  var animationBgDuration   = 500;

  var slidesDidLoad = function() {
    $('#slidesLoaded').text(slidesLoadedCount);
    if (slidesLoadedCount == slides.length) {
      slidesLoaded = true;
      $('.preloader').hide();
      $('.slide').on('click', function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        if ($(':animated').length == 0) {
          nextSlide(this);
        }
      })
      nextSlide();
    }
  }

  var _slide = function(slide) {
    var el = $('<div class="slide"></div>')
        .addClass(slide['type'])
        .append();
    if (slide['type'] != 'video') {
      var content = $('<img></img>').attr('src', slide['src']);
      content.load(function() { slidesLoadedCount += 1; slidesDidLoad(); });
      el.append(content);
    } else {
      console.log('slide.');
      var content = $('<iframe></iframe>').attr('src', slide['src']);
      content.load(function() { slidesLoadedCount += 1; slidesDidLoad(); });
      el.append(content);
    }
    return el;
  }

  var centerHorizontally = function(element) {
    element.css({
      'left': '50%',
      'margin-left': -(element.width() / 2)
    });
  }

  var centerVertically = function(element) {
    element.css({
      'top': '50%',
      'margin-top': -(element.height() / 2)
    })
  }

  var positionSlide = function(slide, element) {
    //console.log(slide);
    switch(slide['type']) {
      case 'actualSize':
        element.css({
          'left': '50%',
          'margin-left': -(element.width() / 2)
        });
        break;
      case 'fit':
        var img        = element.children('img').first();
        var img_width  = img.width();
        var img_height = img.height();
        var w_width    = $(window).width();
        var w_height   = $(window).height();

        img.removeClass('fill');

        if (img_width == 0 || img_height == 0) {
          element.css({
            visibility: 'hidden',
            display:    'block'
          });
          img_width  = img.width();
          img_height = img.height();
          element.css({
            visibility: 'visible',
            display:    'none'
          });
        }

        // if (img_width < $(window).width()) { img_width = $(window.width)}
        // if (img_height < $(window).height()) { img_height = $(window.height)}

        //console.log('h: ' + img_height + ', w ' + img_width);

        if ((img_width / img_height) > 1)  {
          element.removeClass('tall').addClass('wide');
          element.width('100%');
          if (img.height() > 0) { element.height(img.height()); }
          centerVertically(element);
        } else {
          element.removeClass('wide').addClass('tall');
          element.height('100%');
          if (img.width() > 0 ) { element.width(img.width()); }
          centerHorizontally(element);
        }

        break;
      case 'fillWidth':
        element.width('100%');
        break;
      case 'video':
        var iframe = element.children('iframe');
        iframe.css({
          height: '100%',
          width:  '100%'
        });
    }

    setContainerSize();
  }

  var setContainerSize = function() {
    var el = nthSlide(currentSlide);
    var viewportHeight = $(window).height();
    var viewportWidth  = $(window).width();
    var slideHeight    = el.height();
    var slideWidth     = el.width();
    var container = $('.presentation-containter');
    container.height(slideHeight > viewportHeight ? slideHeight : viewportHeight);
    container.width(viewportWidth > slideWidth ? viewportWidth : slideWidth);
  }

  var nextSlide = function() {
    // console.log(currentSlide);
    currentSlide += 1;
    // console.log(currentSlide);
    if (currentSlide < slides.length) {
      nthSlide(currentSlide - 1).css('opacity', '0');
      $('.presentation-container').scrollTop(0); 
      if (currentSlide > 0) {
        hideSlide(nthSlide(currentSlide - 1));
      }
      positionSlide(slides[currentSlide], nthSlide(currentSlide));
      changeBackground(slides[currentSlide]);
      showSlide(nthSlide(currentSlide));
      setNextSlideButton(slides[currentSlide]);
    } else {
      nthSlide(currentSlide - 1).css('opacity', '0');
      currentSlide = -1;
      nextSlide();
    }
  }

  var setNextSlideButton = function(slide) {
    if ((slide['showHint'] == true) && (currentSlide < (slides.length - 1))) {
      $('#next-slide').show();
      var elWidth = -($('#next-slide').width() / 2)
      $('#next-slide').css({
        left: '50%',
        'margin-left': elWidth
      });
    } else {
      $('#next-slide').hide();
    }
  }

  var hideSlide = function(slide) {
    slide.finish().hide();
  }

  var showSlide = function(slide) {
    slide.show().stop().animate({ opacity: 1}, animationShowDuration);
  }

  var changeBackground = function(slide) {
    $('.presentation-container').attr('style', 'background: ' + slide['backgroundCss']);
  }

  var nthSlide = function(n) {
    var el = $('#presentation-slides .slide:nth-child(' + (n+1) + ')').first();
    return el;
  }

  for (var i = 0; i < slides.length; i++) {
    slide = slides[i];
    el = _slide(slide);
    console.log('slides');
    $('#presentation-slides').append(el);
  }

  return this;
};