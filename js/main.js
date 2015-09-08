// настройки шаблонизатора
_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
};

// пространство имен приложения
APP = {
    Views: {},
    Models: {},
    Collections: {}
};

// простая модель для слайдов
APP.Models.Slide = Backbone.Model.extend({
    // defaults: {
    //     id: 1,
    //     type: 'fitWidth',
    //     image: '/img/01.jpg'
    // },

    show: function() {
        this.getEl().show();
    },

    getEl: function() {
        return $('#slide-' + this.id);
    },

    getControl: function() {
        return $('.jump-to').eq(this.id - 1);
    }
});

// коллекция слайдов
APP.Collections.Slides = Backbone.Collection.extend({
    model: APP.Models.Slide
});

// вся логика здесь
APP.Views.Slideshow = Backbone.View.extend({

    el: '#slideshow',
    slides: '#slideshow .slides',
    controls: '#slideshow .controls',
    overlay: '#overlay',
    totalCount: '#overlay .total',
    currentCount: '#overlay .current',

    delay: 5000,
    currentIndex: 0,
    slidesLoadedCount: 0,
    controlsShown: false,
    setTimeout: false,
    isAnimating: false,

    events: {
        'click .jump-to': 'jumpTo',
        'click .next':    'nextSlide',
        'click .prev':    'prevSlide',
        'click .slide':   'showControls',
        // 'click #slide-0': 'showControls'
    },

    slideTemplate: _.template('<li id="slide-{{ id }}" class="slide {{ type }}">' +
                              '</li>'),

    //controlTemplate: _.template('<li class="slide-control jump-to">{{ human_readable_index }}</li>'),

    initialize: function() {
        _.bindAll(this, 'render', 'nextSlide', 'prevSlide', 'initialPlay', 'transition', 'jumpTo', 'showControls', 'slideLoaded', 'centerSlide', 'bindHammer', 'unbindHammer');
        var self = this;
        $('#show-controls-block').click(this.showControls);
    },

    render: function() {
        var self = this;
        $(this.totalCount).text(this.collection.length);
        $('.overlay-content').show();
        this.collection.each(function(slide, i) {
            $(self.slides).append(self.slideTemplate(slide.toJSON()));
            if (slide.get('type') == 'video') {
                var content = $('<iframe/>').attr('src', slide.get('src')).attr('rel', slide.get('id')).attr('width', $(window).width()).attr('height', $(window).height()).append('');
                var id = $(this).attr('rel');
                $("#slide-" + slide.get('id')).append(content);
                self.slidesLoadedCount += 1;
                self.slideLoaded();
                $(this.controls).fadeIn('slow');
                this.controlsShown = true;
            } else {
                var content = $('<img/>').attr('src', slide.get('image')).attr('rel', slide.get('id'));
                content.load(function() {
                    var id = $(this).attr('rel');
                    $("#slide-" + id).append(content);
                    self.slidesLoadedCount += 1;
                    self.slideLoaded();
                });
            }
            // $(self.controls).append(self.controlTemplate({
            //     index: i,
            //     human_readable_index: ++i
            // }));
        });
        this.showControls();
        return this;
    },

    slideLoaded: function() {
        var total = this.collection.length;
        $(this.currentCount).text(this.slidesLoadedCount);
        if (this.slidesLoadedCount == total) {
            this.initialPlay();
        }
    },

    nextSlide: function() {
        var current = this.currentIndex;
        var next = this.currentIndex === (this.collection.length - 1) ? 0 : this.currentIndex + 1;
        this.controlsShown = false;
        this.showControls();
        this.transition(current, next);
    },

    prevSlide: function() {
        var current = this.currentIndex;
        var prev = this.currentIndex === (0) ? this.collection.length - 1 : this.currentIndex - 1;
        this.controlsShown = false;
        this.showControls();
        this.transition(current, prev);
    },

    centerSlide: function(el) {
        var scroll_x = (el.children('img').width() - $(window).width()) / 2;
        if (scroll_x < 0) { scroll_x = 0; }
        $('.slides').scrollTo(scroll_x, 0);
        scrollTo(0, 0);
    },

    transition: function(from, to) {
        if (!this.isAnimating) {
            this.isAnimating = true;
            var current = this.collection.at(from);
            var next = this.collection.at(to);
            var self = this;
            current.getEl().fadeOut('slow', function() {
                next.getEl().fadeIn('slow');
                self.centerSlide(next.getEl());
                $('html,body').animate({
                    scrollTop: $(this).offset().top - ( $(window).height() - $(this).outerHeight(true) ) / 2
                }, 200);
                self.isAnimating = false;
            });
            current.getControl().toggleClass('current');
            next.getControl().toggleClass('current');
            this.currentIndex = to;
        }
    },


    initialPlay: function() {
        // this.collection.at(0).show();
        var first = this.collection.at(0).getEl();
        this.centerSlide(first);
        $(this.overlay).fadeOut('slow');
        this.collection.at(0).getControl().toggleClass('current');
    },

    jumpTo: function(e) {
        var next = $(e.currentTarget).data('index');
        this.transition(this.currentIndex, next);
    },

    showControls: function() {
        if (!this.controlsShown) {
            $(this.controls).fadeIn('slow');
            this.controlsShown = true;
            this.bindHammer();
            var self = this;
            // if (this.setTimeout) {
            //     setTimeout(function() {
            //         self.controlsShown = false;
            //         $(self.controls).fadeOut('slow');
            //         self.unbindHammer();
            //     }, self.delay);  
            // };
            // this.setTimeout = true;
        }
    },

    bindHammer: function() {
        var self = this;
        $('.slide').hammer().on('swipeleft', function(evt) {
            evt.gesture.preventDefault();
            self.nextSlide();
        });
        $('.slide').hammer().on('swiperight', function(evt) {
            evt.gesture.preventDefault();
            self.prevSlide();
        });
    },

    unbindHammer: function() {
        var self = this;
        $('.slide').hammer().off('swiperight');
        $('.slide').hammer().off('swipeleft');
    },

});


// creates an instance of our slideshow, passes in a new collection of slides
APP.Slideshow = new APP.Views.Slideshow({
    collection: new APP.Collections.Slides([
        new APP.Models.Slide({
            id: 13,
            image: 'img/13.jpg',
            type:  'fitWidth'
        }),
        
        new APP.Models.Slide({
            id: 1,
            image: 'img/1.jpg',
            type: 'fitWidth'
        }),
        new APP.Models.Slide({
            id: 2,
            image: 'img/2.jpg',
            type:  'fitWidth'
        }),
        new APP.Models.Slide({
            id: 3,
            image: 'img/3.jpg',
            type:  'fitWidth'
        }),
        new APP.Models.Slide({
            id: 4,
            image: 'img/4.jpg',
            type:  'fitWidth'
        }),
        new APP.Models.Slide({
            id: 5,
            image: 'img/5.jpg',
            type:  'fitWidth'
        }),
        new APP.Models.Slide({
            id: 6,
            image: 'img/6.jpg',
            type:  'fitWidth'
        }),
        new APP.Models.Slide({
            id: 7,
            image: 'img/7.jpg',
            type: 'fitWidth'
        }),
        new APP.Models.Slide({
            id: 8,
            image: 'img/8.jpg',
            type:  'fitWidth'
        }),
        new APP.Models.Slide({
            id: 9,
            image: 'img/9.jpg',
            type:  'fitWidth'
        }),
        new APP.Models.Slide({
            id: 10,
            image: 'img/10.jpg',
            type:  'fitWidth'
        }),
        new APP.Models.Slide({
            id: 11,
            image: 'img/11.jpg',
            type:  'fitWidth'
        }),
        new APP.Models.Slide({
            id: 12,
            image: 'img/12.jpg',
            type:  'fitWidth'
        })

        
        ])
}).render();
