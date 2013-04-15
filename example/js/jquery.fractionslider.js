/*
 * jQuery Fraction Slider v0.8.3
 * http://fractionslider.jacksbox.de
 *
 * Author: Mario Jäckle
 * eMail: support@jacksbox.de
 *
 * Copyright 2013, jacksbox.design
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */


(function($) {
	
	/** ************************* **/
	/** SLDIER CLASS  **/
	/** ************************* **/
	
	// here happens all the fun
	var FractionSlider = function(element, options){
		
		var vars = {
			init: 			true, 	// initialised the first time
			running: 		false,	// currently running
			pause: 			false,
			stop: 			false,
			controlsActive: true,	// currently running
			currentSlide: 	0,		// current slide number
			lastSlide: 		null,		// last slide number (for anim out)
			maxSlide: 		0,		// max slide number
			currentStep: 	0,		// current step number
			maxStep: 		0,		// current slide number
			currentObj: 	0,		// curent object number (in step)
			maxObjs: 		0,		// max object number (in step)
			finishedObjs: 	0		// finsihed objects (in step)
		};
		
		// Here are Slide elements temporarily stored
		var temp = {
			currentSlide: 			null, 	// current Slide
			lastSlide: 				null,	// last Slide (for anim out)
		};
		
		var timeouts = [];
		
		var fractionObjs = null; 	// objs for current step
		
		var dX = null, dy = null;
		
		$(element).wrapInner('<div class="fraction-slider" />');
		
		var	slider = $(element).find('.fraction-slider'),
			pager = null; 	// the slider element
		
		vars.maxSlide = slider.children('.slide').length - 1;
		
		// some more needed vars
		var sliderWidth = slider.width();
		var bodyWidth = $('body').width();
		var offsetX = 0;
		if(options['fullWidth']){
	    	offsetX = (bodyWidth-sliderWidth)/2;
			sliderWidth = bodyWidth;
		}
		var sliderHeight = slider.height();
		
		init();
		
		/** ************************* **/
		/** INITIALIZE **/
		/** ************************* **/
		
		function init(){
			
			// controls
			if(options['controls']){
				slider.append('<a href="#" class="prev"></a><a href="#" class="next" ></a>');
				
				slider.find('.next').bind('click', function(){return nextBtnPressed()
				})
				slider.find('.prev').bind('click', function(){return prevBtnPressed()
				});
			}

			// fullwidth setup
			if(options['fullWidth']){
				slider.css({'overflow': 'visible'});
			}else{
				slider.css({'overflow': 'hidden'});
			}
			
			// pager
			if(options['pager']){
				pager = $('<div class="fs-pager-wrapper"></div>');
				slider.append(pager);
			}
			
			slider.children('.slide').each(function(index){
				var slide = $(this);
				slide.children().attr('rel', index).addClass('fs_obj');
				slide.children('[data-fixed]').addClass('fs_fixed_obj');
				
				// pager again
				if(options['pager']){
					var tempObj = $('<a rel="'+index+'" href="#"></a>').bind('click', function(){return pagerPressed(this)});
					pager.append(tempObj);
				}	
			});
			if(options['pager']){
				pager = $(pager).children('a');
			}
			
			// responisve
			if(options['responsive']){
				makeResponsive();
			}
			
			// remove spinner
			if(slider.find('.fs_loader').length > 0){
				slider.find('.fs_loader').remove();
			}
			
			// all importent stuff is done, everybody has taken a shower, we can go
			// starts the slider and the slide rotation
			start();
		}
		
		/** ************************* **/
		/** METHODES **/
		/** ************************* **/
		
		function start(){
			vars.stop = false;
			vars.pause = false;
			vars.running = true;
			
			cycle('slide');
		}
		
		function startNextSlide(){
			vars.stop = false;
			vars.pause = false;
			vars.running = true;
			
			nextSlide();
		}
		
		// use with start or startNextSlide
		function stop(){
			vars.stop = true;
			vars.running = false;
			
			slider.find('.slide').stop(true, true);
			slider.find('.fs_obj').stop(true, true).removeClass('fs-animation');
			stopTimeouts(timeouts);
		}
		
		// use with resume
		function pause(){
			vars.pause = true;
			vars.running = false;
			
			slider.find('.fs-animation').finish();
		}
		
		// use with pause
		function resume(){
			vars.stop = false;
			vars.pause = false;
			vars.running = true;
			
			if(vars.finishedObjs < vars.maxObjs){
				cycle('obj');
			}else
			if(vars.finishedObjs < vars.maxStep){
				cycle('step');
			}else{
				cycle('slide');
			}
		}
		
		function nextSlide(){
			vars.init = true;
						
			vars.lastSlide = vars.currentSlide;
			vars.currentSlide++;
			
			vars.stop = false;
			vars.pause = false;
			vars.running = true;
			
			slideChangeControler();
		}
		
		function prevSlide(){
			vars.init = true;
			
			vars.lastSlide = vars.currentSlide;			
			vars.currentSlide--;
			
			vars.stop = false;
			vars.pause = false;
			vars.running = true;
			
			slideChangeControler();
		}
		
		function targetSlide(slide){
			vars.init = true;
			
			vars.lastSlide = vars.currentSlide;
			vars.currentSlide = slide;
			
			vars.stop = false;
			vars.pause = false;
			vars.running = true;
			
			slideChangeControler();
		}
		
		/** ************************* **/
		/** PAGER & CONTROLS **/
		/** ************************* **/
		
		function pagerPressed(el){
			stop();
			targetSlide($(el).attr('rel'));
			return false;
		}
		
		function prevBtnPressed(){
			stop();
			prevSlide();
			return false;
		}
		function nextBtnPressed(){
			stop();
			nextSlide();
			return false;
		}

		/** ************************* **/
		/** CYCLE CONTROLLER **/
		/** ************************* **/
		
		function cycle(type){
			
			if(!vars.pause && !vars.stop && vars.running){
				switch(type){
					case "slide":
					    slideRotation();
						break;
					case "step":
						iterateSteps();
					 	break;	
					case "obj":
						iterateObjs();
						break;
				}
			}
		}
		
		/** ************************* **/
		/** SLIDES **/
		/** ************************* **/
		
		function slideRotation(){
			var timeout = 0;
			// set timeout | first slide instant start
			if(vars.init){
				timeout = 0;
				vars.init = false;
			}else{
				timeout = options['timeout'];
			}
			
			// timeout after slide is complete	
			timeouts.push(setTimeout(function(){
					// stops the slider after first slide (only when slide count = 1)
					if(vars.maxSlide == 0 && vars.running == true){
						// TODO: better solution!
					}else{
						slideChangeControler();
					}
				}, 
				timeout
			));
		}
		
		function slideChangeControler(){
			$('.active-slide').removeClass('active-slide');
			
			if(vars.currentSlide > vars.maxSlide){
				vars.currentSlide = 0;
			}
			
			temp.currentSlide = slider.children('.slide:eq('+vars.currentSlide+')').addClass('active-slide');
			
			if(temp.currentSlide.length == 0){
				vars.currentSlide = 0;
				temp.currentSlide = slider.children('.slide:eq('+vars.currentSlide+')');
			}
			
			if(vars.lastSlide != null){
				if(vars.lastSlide < 0){
					vars.lastSlide = vars.maxSlide;
				}
				
				temp.lastSlide = slider.children('.slide:eq('+vars.lastSlide+')');
			}
			
			var animation = temp.currentSlide.attr("data-in");

			if(animation == null){
				animation = options['slideTransition'];
			}
			
			if(options['slideEndAnimation'] && vars.lastSlide != null){
				switch(animation){
					case 'scrollLeft':
						startSlide(animation);
						endSlide(animation);
						break;
					case 'scrollRight':
						startSlide(animation);
						endSlide(animation);
						break;
					case 'scrollTop':
						startSlide(animation);
						endSlide(animation);
						break;
					case 'scrollBottom':
						startSlide(animation);
						endSlide(animation);
						break;
					default:
						startSlide(animation);
						break;
				}
			}else{
				switch(animation){
					case 'none':
						startSlide(animation);
						endSlide(animation);
						break;
					case 'scrollLeft':
						startSlide(animation);
						endSlide(animation);
						break;
					case 'scrollRight':
						startSlide(animation);
						endSlide(animation);
						break;
					case 'scrollTop':
						startSlide(animation);
						endSlide(animation);
						break;
					case 'scrollBottom':
						startSlide(animation);
						endSlide(animation);
						break;
					default:
						startSlide(animation);
						break;
				}
			}
		}
		
		// starts a slide
		function startSlide(animation){	
			animation = temp.currentSlide.attr("data-in");

			if(animation == null){
				animation = options['slideTransition'];
			}			
				
			if(options['backgroundAnimation']){
				backgroundAnimation()
			};
			
			if(options['pager']){
				pager.removeClass('active');
				pager.eq(vars.currentSlide).addClass('active');
			};
			
			getStepsForSlide();
			
			temp.currentSlide.children().hide();
			
			vars.currentStep = 0;
			vars.currentObj = 0;
			vars.maxObjs = 0;
			vars.finishedObjs = 0;
			
			temp.currentSlide.children("[data-fixed]").show();
			
			slideAnimationIn(animation);
		}
		
		slider.bind('fraction:startSlideComplete', function(){
			if(temp.lastSlide != null){
				temp.lastSlide.hide();
			}
			cycle('step');
		});
		
		// ends a slide
		function endSlide(animation){
			
			if(temp.lastSlide == null){
				return;
			}		
			
			if(animation == 'none' || options['slideEndAnimation']){
				var objs = temp.lastSlide.children();

				objs.each(function(){
					var obj = $(this);
					var position = obj.position();
					var transition = obj.attr("data-out");
					var easing = obj.attr("data-ease-out");

					if(transition == null){
						transition = options['transitionOut'];
					}

					if(easing == null){
						easing = options['easeOut'];
					}

					moveObjectOut(obj, position, transition, null,easing);
				}).promise().done(function(){		
					slideAnimationOut(animation);	
				});
			}else{
				slideAnimationOut(animation);
			}
		}
		
		slider.bind('fraction:endSlideComplete', function(){
			if(options['slideEndAnimation']){
				startSlide();
			}else{
				temp.lastSlide.hide();
			}
		});
		
		/** ************************* **/
		/** STEPS **/
		/** ************************* **/
		
		// gets the maximum step for the current slide
		function getStepsForSlide(){
			var objs = temp.currentSlide.children();
			var maximum = 0;
			
			objs.each(function() {
			  var value = parseFloat($(this).attr('data-step'));
			  maximum = (value > maximum) ? value : maximum;
			});
			
			vars.maxStep = maximum;
		}
		
		function iterateSteps(){
			if(vars.currentStep == 0){
				var objs = temp.currentSlide.children('*:not([data-step]):not([data-fixed]), *[data-step="'+vars.currentStep+'"]:not([data-fixed])');
			}else{
				var objs = temp.currentSlide.children('*[data-step="'+vars.currentStep+'"]:not([data-fixed])');
			}
			
			vars.maxObjs = objs.length;
			
			fractionObjs = objs;
			
			if(vars.maxObjs > 0){
				
				vars.currentObj = 0;
				vars.finishedObjs = 0;
				
				cycle('obj');
			}else{	
				slider.trigger('fraction:stepFinished');
			}
		}
		
		function stepFinished(){
			vars.currentStep++
			if(vars.currentStep > vars.maxStep){
				if(options['autoChange']){
					vars.lastSlide = vars.currentSlide;
					vars.currentSlide++;
					vars.currentStep = 0;
			
					cycle('slide');
				}
			
				return;
			}
			cycle('step');
		}
		
		slider.bind('fraction:stepFinished', function(){
			stepFinished();
		});
		
		/** ************************* **/
		/** OBJECTS **/
		/** ************************* **/
		
		function iterateObjs(){
			var obj = $(fractionObjs[vars.currentObj]);

			obj.addClass('fs-animation');

			var position = obj.attr("data-position");
			var transition = obj.attr("data-in");
			var delay = obj.attr("data-delay");
			var time = obj.attr('data-time');
			var easing = obj.attr('data-ease-in');
			// check for special options
			var special = obj.attr("data-special");
			
			if(position == null){
				position = options['position'].split(',');
			}else{
				position = position.split(',');
			}
			if(transition == null){
				transition = options['transitionIn'];
			}
			if(delay == null){
				delay = options['delay'];
			}
			if(easing == null){
				easing = options['easeIn'];
			}
			moveObjectIn(obj, position, transition, delay, time, easing, special);
			
			vars.currentObj++;
			
			if(vars.currentObj < vars.maxObjs){
				cycle('obj');
			}else{
				vars.currentObj = 0;
			}
		}
		
		function objFinished(obj){
			obj.removeClass('fs-animation');
			
			if(obj.attr('rel') == vars.currentSlide){
				vars.finishedObjs++;
				if(vars.finishedObjs == vars.maxObjs){
					slider.trigger('fraction:stepFinished');
				}	
			}
		}
		
		/** ************************* **/
		/** TRANSITIONS **/
		/** ************************* **/
		
		/** TRANSITION SLIDES **/
		
		function slideAnimationIn(animation){
			var cssStart = {},
			    cssEnd = {};
			
			var speed = options['slideTransitionSpeed'];
			
			if(options['responsive']){
				unit = '%';
			}else{
				unit = 'px';
			}
			
			switch(animation){
				case 'slideLeft':
					cssStart.left = sliderWidth + unit;
					cssStart.top = 0 + unit;
					cssStart.display = 'block';
					cssEnd.left = 0 + unit;
					cssEnd.top = 0 + unit;
					break;
				case 'slideTop':
					cssStart.left = 0 + unit;
					cssStart.top = 0 - sliderHeight + unit;
					cssStart.display = 'block';
					cssEnd.left = 0 + unit;
					cssEnd.top = 0 + unit;
					break;
				case 'slideBottom':
					cssStart.left = 0 + unit;
					cssStart.top = sliderHeight + unit;
					cssStart.display = 'block';
					cssEnd.left = 0 + unit;
					cssEnd.top = 0 + unit;
					break;
				case 'slideRight':
					cssStart.left = 0 - sliderWidth + unit;
					cssStart.top = 0 + unit;
					cssStart.display = 'block';
					cssEnd.left = 0 + unit;
					cssEnd.top = 0 + unit;
					break;
				case 'fade':
					cssStart.left = 0 + unit;
					cssStart.top = 0 + unit;
					cssStart.display = 'block';
					cssStart.opacity = 0;
					cssEnd.opacity = 1;
					break;
				case 'none':
					cssStart.left = 0 + unit;
					cssStart.top = 0 + unit;
					cssStart.display = 'block';
					speed = 0;
					break;
				case 'scrollLeft':
					cssStart.left = sliderWidth + unit;
					cssStart.top = 0 + unit;
					cssStart.display = 'block';
					cssEnd.left = 0 + unit;
					cssEnd.top = 0 + unit;
					break;
				case 'scrollTop':
					cssStart.left = 0 + unit;
					cssStart.top = 0 - sliderHeight + unit;
					cssStart.display = 'block';
					cssEnd.left = 0 + unit;
					cssEnd.top = 0 + unit;
					break;
				case 'scrollBottom':
					cssStart.left = 0 + unit;
					cssStart.top = sliderHeight + unit;
					cssStart.display = 'block';
					cssEnd.left = 0 + unit;
					cssEnd.top = 0 + unit;
					break;
				case 'scrollRight':
					cssStart.left = 0 - sliderWidth+ unit;
					cssStart.top = 0 + unit;
					cssStart.display = 'block';
					cssEnd.left = 0 + unit;
					cssEnd.top = 0 + unit;
					break;
			}
			
			temp.currentSlide.css(cssStart).animate(cssEnd, speed, 'linear',
		   		 function(){
					slider.trigger('fraction:startSlideComplete');
		   		 	}
			);
		}
		function slideAnimationOut(animation){
			var cssStart = {},
				cssEnd = {};
			
			var speed = options['slideTransitionSpeed'];
			var unit = null;
			
			if(options['responsive']){
				unit = '%';
			}else{
				unit = 'px';
			}
			
			switch(animation){
				case 'none':
					cssStart.display = 'none';
					speed = 0
					break;
				case 'scrollLeft':
					cssEnd.left = 0 - sliderWidth + unit;
					cssEnd.top = 0 + unit;
					break;
				case 'scrollTop':
					cssEnd.left = 0 + unit;
					cssEnd.top = sliderHeight + unit;
					break;
				case 'scrollBottom':
					cssEnd.left = 0 + unit;
					cssEnd.top = 0 - sliderHeight + unit;
					break;
				case 'scrollRight':
					cssEnd.left = sliderWidth + unit;
					cssEnd.top = 0 + unit;
					break;
				default:
					speed = 0;
					break;
			}
			
			temp.lastSlide.animate(cssEnd, speed, 'linear',
		   		 function(){
					slider.trigger('fraction:endSlideComplete');
		   		 	}
			);
		}
		
		/** IN TRANSITION OBJECTS **/
		function moveObjectIn(obj, position, transition, delay, time, easing, special){
			var startY = null;
			var startX = null;
			var targetY = null;
			var targetX = null;
			var speed = null;
			
			// set start position
			switch(transition){
				case 'left':
					startY = position[0];
					startX = sliderWidth;
					break;
				case 'bottomLeft':
					startY = sliderHeight;
					startX = sliderWidth;
					break;
				case 'topLeft':
					startY = obj.outerHeight()*-1;
					startX = sliderWidth;
					break;
				case 'top':
					startY = obj.outerHeight()*-1;
					startX = position[1];
					break;
				case 'bottom':
					startY = sliderHeight;
					startX = position[1];
					break;
				case 'right':
					startY = position[0];
					startX = 0 - offsetX- obj.outerWidth();
					break;
				case 'bottomRight':
					startY = sliderHeight;
					startX = 0 - offsetX- obj.outerWidth();
					break;
				case 'topRight':
					startY = obj.outerHeight()*-1;
					startX = 0 - offsetX- obj.outerWidth();
					break;
			}
			
			
			// set target position
			targetY = position[0];
			targetX = position[1];
			
			
			// #time
			if(time == null){
				speed = options['speedIn'];
			}else{
				speed = time - delay;
			}
			
			if(options['responsive']){
				targetX = targetX+'%';
				targetY = targetY+'%';
				startX = startX+'%';
				startY = startY+'%';
			}else{
				targetX = targetX+'px';
				targetY = targetY+'px';
				startX = startX+'px';
				startY = startY+'px';
			}
			
			// set the delay
			timeouts.push(setTimeout(function(){
				// for special=cylce 
				if(special == 'cycle' && obj.attr('rel') == vars.currentSlide){
					var tmp = obj.prev();
					if(tmp.length > 0){
						var tmpPosition = $(tmp).attr('data-position').split(',');
					    	tmpPosition = {'top':tmpPosition[0],'left':tmpPosition[1]};
						var tmpTransition = $(tmp).attr('data-out');
							if(tmpTransition == null){
								tmpTransition = options['transitionOut'];
							}
						moveObjectOut(tmp, tmpPosition, tmpTransition, speed);
					}
				}
				
				if(transition == 'fade'){
					 obj.css({"top": targetY, "left": targetX})
						.fadeIn(speed, 
				   		 function(){
				   		 	objFinished(obj);
				   		 	}
						)
						.addClass('fs_obj_active');					
				}else if(transition == 'none'){
					// no animation
					 obj.css({"top": targetY, "left": targetX})
						.show(0, 
				   		 function(){
				   		 	objFinished(obj);
				   		 	}
						)
						.addClass('fs_obj_active');
				}else{
					// animate
					obj.css({"top": startY, "left": startX})
					   .show()
					   .animate({"top": targetY, "left": targetX}, 
					   		 speed, 
					   		 easing, 
					   		 function(){
					   		 	objFinished(obj);
					   		 	}
					   		)
					   .addClass('fs_obj_active');	
				}
			},delay));
		}
		
		/** OUT TRANSITION OBJECTS **/
		function moveObjectOut(obj, position, transition, speed, easing){
			var targetY = null;
			var targetX = null;
			// set target position
			switch(transition){
				case 'left':
					targetY = obj.css('top');
					if(targetY.indexOf('px') > 0 && options['responsive']){
						targetY = targetY.substring(0,targetY.length - 2);
						targetY = pixelToPercent(targetY, dY);
					};
					targetX = 0 - offsetX - 100 - obj.outerWidth();
					break;
				case 'bottomLeft':
					targetY = sliderHeight;
					targetX = 0 - offsetX - 100 - obj.outerWidth();
					break;
				case 'topLeft':
					targetY = obj.outerHeight()*-1;
					targetX = 0 - offsetX - 100 - obj.outerWidth();
					break;
				case 'top':
					targetY = obj.outerHeight()*-1;
					targetX = obj.css('left');
					if(targetX.indexOf('px') > 0 && options['responsive']){
						targetX = targetX.substring(0,targetX.length - 2);
						targetX = pixelToPercent(targetX, dX);
					};
					break;
				case 'bottom':
					targetY = sliderHeight;
					targetX = obj.css('left');
					targetX = obj.css('left');
					if(targetX.indexOf('px') > 0 && options['responsive']){
						targetX = targetX.substring(0,targetX.length - 2);
						targetX = pixelToPercent(targetX, dX);
					};
					break;
				case 'right':
					targetY = obj.css('top');
					if(targetY.indexOf('px') > 0 && options['responsive']){
						targetY = targetY.substring(0,targetY.length - 2);
						targetY = pixelToPercent(targetY, dY);
					};
					targetX = sliderWidth;
					break;
				case 'bottomRight':
					targetY = sliderHeight;
					targetX = sliderWidth;
					break;
				case 'topRight':
					targetY = obj.outerHeight()*-1;
					targetX = sliderWidth;
					break;
				default:
					break;
			}
			
			if(targetY != null){
				if(targetY.toString().indexOf('px') > 0){
					targetY = targetY.substring(0,targetY.length - 2);
				}
			}
			if(targetX != null){
				if(targetX.toString().indexOf('px') > 0){
					targetX = targetX.substring(0,targetX.length - 2);
				}
			}
			
			// get speed for the out transition
			if((speed == null && transition != 'fade') || (speed == null && transition != 'none')){
				var pL = null, pT = null, ms = null;
				var dist = null, distY = null, distX = null;
				if(options['responsive']){
					ms = pixelToPercent(1000, dX);
					pL = pixelToPercent(position['left'], dX);
					pT = pixelToPercent(position['top'], dY);
				}else{
					ms = 1000;
					pL = position['left'];
					pT = position['top'];
				}
				
				
				
				if(pL>targetX){
					distX = Math.abs(pL-targetX);
				}else
				if(targetX>pL){
					distX = Math.abs(targetX-pL);
				}else{
					distX = 0;
				}
				
				if(pT>targetY){
					distY = Math.abs(pT-targetY);
				}else
				if(targetY>pT){
					distY = Math.abs(targetY-pT);
				}else{
					distY = 0;
				}
				
				dist = Math.sqrt((distX*distX)+(distY*distY));
				
				// calculate the speed for transition
				speed = (dist * (options['speedOut']/ms));
			}else if(speed != null){	
				speed = options['speedOut'];
			}else{
				speed = options['speedOut'];
			}	
				
			
			if(targetX != null){		
				if(options['responsive']){
					targetX = targetX+'%';
				}else{
					targetX = targetX+'px';
				}
			}
			if(targetY != null){		
				if(options['responsive']){
					targetY = targetY+'%';
				}else{
					targetY = targetY+'px';
				}
			}		
			
			if(transition == 'fade'){
				// fade
				obj.fadeOut(speed, 
							function(){
								obj.hide();
								}
					)
					.removeClass('fs_obj_active');				
			}else if(transition == 'none'){
				// animation
				obj.hide(0,
						function(){
							obj.hide();
							}
					)
					.removeClass('fs_obj_active');
			}else{
				// animation
				obj.animate({"top": targetY, "left": targetX}, 
							speed, 
							easing, 
							function(){
								obj.hide();
								}
					)
					.removeClass('fs_obj_active');	
			}
		}
		
		function backgroundAnimation(){
			if(options['backgroundElement'] == null || options['backgroundElement'] == ""){
				var el = slider.parent();
			}else{
				var el = $(options['backgroundElement']);
			}
			
			var oldPos = el.css('background-position');
			    oldPos = oldPos.split(' ');
			var moveX = options['backgroundX'];	
			var moveY = options['backgroundY'];
			var x = Number(oldPos[0].replace(/[px,%]/g, '')) + moveX;	
			var y = Number(oldPos[1].replace(/[px,%]/g, '')) + moveY;
			
			el.animate({backgroundPositionX: x+'px', backgroundPositionY: y+'px'}, options['backgroundSpeed'], options['backgroundEase']);
		}
		
		
		/** ************************* **/
		/** RESPONSIVE **/
		/** ************************* **/
		
		function makeResponsive(){
			var d = options['dimensions'].split(',');
			
				dX = d['0'],
				dY = d['1'];
			
			var objs = slider.children('.slide').find('*');
			
			objs.each(function(){
				var obj = $(this),
					x = null,
					y = null,
					value = null;
				
				// calculate % position	
				if(obj.attr("data-position") != null){
					var position = obj.attr("data-position").split(',');
					
					x = pixelToPercent(position[1], dX);
					y = pixelToPercent(position[0], dY);
					obj.attr("data-position", y+','+x);
				}
				
				// calculate % width
				if(obj.attr("width") != null){
					value = obj.attr("width");
					
					x = pixelToPercent(value, dX);
					obj.attr("width", x+"%");
					obj.css("width", x+"%");
				}else 
				if(obj.css('width') != '0px'){
					value = obj.css("width");
					if(value.indexOf('px') > 0){
						value = value.substring(0,value.length - 2);
						x = pixelToPercent(value, dX);
						obj.css("width", x+"%");
					};
				}else
				if(obj.prop("tagName").toLowerCase() == 'img'){
					value = obj.get(0).width;
					x = pixelToPercent(value, dX);
					obj.css("width", x+"%");
				}
				
				// calculate % height
				if(obj.attr("height") != null){
					value = obj.attr("height");
					
					y = pixelToPercent(value, dY);
					obj.attr("height", y+"%");
					obj.css("height", y+"%");
				}else
				if(obj.css('height') != '0px'){
					value = obj.css("height");
					if(value.indexOf('px') > 0){
						value = value.substring(0,value.length - 2);
						y = pixelToPercent(value, dY);
						obj.css("height", y+"%");
					};
				}else
				if(obj.prop("tagName").toLowerCase() == 'img'){
					value = obj.get(0).height;
					y = pixelToPercent(value, dY);
					obj.css("height", y+"%");
				}
				
				obj.attr('data-fontsize', obj.css('font-size'));
				
			});
			
			slider.css({'width': 'auto', 'height': 'auto'}).append('<div class="fs-stretcher" style="width:'+dX+'px; height:'+dY+'px"></div>');
			
			resizeSlider();
			
			$(window).bind('resize', function(){
				resizeSlider();
			});
		}
		
		function resizeSlider(){
			var w = slider.innerWidth(),
				h = slider.innerHeight();
			if(w < dX){
				var xy = dX/dY,
					nH = w/xy;
				slider.find('.fs-stretcher').css({'width': w+'px','height': nH+"px"});	
			}
			
			// calculate the width/height/offsetX of the slider
			var sW = slider.width();
			offsetX = pixelToPercent(((bodyWidth-sW)/2), dX);
			sliderWidth = 100;
			if(options['fullWidth']){
				sliderWidth = 100 + offsetX*2;
			}
			sliderHeight = 100;
			
			if(vars.init == false || w < dX){
				resizeFontSize();
			}
		}
		
		function resizeFontSize(){
			var value = null,
				n = null;
			var objs = slider.children('.slide').find('*');
			
			objs.each(function(){
				obj = $(this);
				
				var value = obj.attr('data-fontsize');
				
				if(value.indexOf('px') > 0){
					value = value.substring(0,value.length - 2);
					n = pixelToPercent(value, dY) * (slider.find('.fs-stretcher').height()/100);
					obj.css("fontSize", n+"px");
					obj.css("lineHeight", '100%');
				};
				
				
			});
		}
		
		function pixelToPercent(value, d){
			return value/(d/100);
		}
		
		
		/** ************************* **/
		/** HELPER **/
		/** ************************* **/
		
		function stopTimeout(timeout){
			clearTimeout(timeout);
		}

		function stopTimeouts(timeouts){
			var length = timeouts.length;
			$.each(timeouts,function(index){
				clearTimeout(this);
				if(index == length-1){
					timeouts = [];
				}
			});
		}
	}
	
	/** ************************* **/
	/** PLUGIN  **/
	/** ************************* **/
	
  	$.fn.fractionSlider = function(options) {
	
		// defaults & options
		var options = $.extend( {
		  'slideTransition'				: 'none',				// default slide transition
		  'slideTransitionSpeed'		: 2000,				// default slide transition
		  'slideEndAnimation'			: false,				// if set true, objects will transition out at slide end (before the slideTransition is called)
		  'position'					: '0,0',				// default position | should never be used
		  'transitionIn'        		: 'left',				// default in - transition
		  'transitionOut' 				: 'left',				// default out - transition
		  'fullWidth' 					: false,				// transition over the full width of the window
		  'delay' 						: 0,					// default delay for elements
		  'timeout'						: 2000,					// default timeout before switching slides
		  'speedIn'						: 2500,					// default in - transition speed
		  'speedOut'					: 1000,					// default out - transition speed
		  'easeIn'						: 'easeOutExpo',		// default easing in
		  'easeOut'						: 'easeOutCubic',		// default easing out
		
		  'controls'					: false,				// controls on/off
		  'pager'						: false,				// controls on/off
		  'autoChange'					: true,					// auto change slides
		
		  'backgroundAnimation'			: false,				// background animation
		  'backgroundElement'			: null,					// element to animate | default fractionSlider element
		  'backgroundX'					: 500,					// default x distance
		  'backgroundY'					: 500,					// default y distance
		  'backgroundSpeed'				: 2500,					// default background animation speed
		  'backgroundEase'				: 'easeOutCubic',		// default background animation easing
		
		  'responsive'					: false,				// default background animation speed
		  'dimensions'					: '',					// default background animation easing
		}, options);
		
		return this.each(function(){
			// ready for take-off 
			var slider = new FractionSlider(this, options);
		});
  	};

	/** ************************* **/
	/** EASING EXTEND  **/
	/** ************************* **/

	// based on jqueryui (http://jqueryui.com/)
	// based on easing equations from Robert Penner (http://www.robertpenner.com/easing)

	var baseEasings = {};

	$.each( [ "Quad", "Cubic", "Quart", "Quint", "Expo" ], function( i, name ) {
		baseEasings[ name ] = function( p ) {
			return Math.pow( p, i + 2 );
		};
	});

	$.extend( baseEasings, {
		Sine: function ( p ) {
			return 1 - Math.cos( p * Math.PI / 2 );
		},
		Circ: function ( p ) {
			return 1 - Math.sqrt( 1 - p * p );
		},
		Elastic: function( p ) {
			return p === 0 || p === 1 ? p :
				-Math.pow( 2, 8 * (p - 1) ) * Math.sin( ( (p - 1) * 80 - 7.5 ) * Math.PI / 15 );
		},
		Back: function( p ) {
			return p * p * ( 3 * p - 2 );
		},
		Bounce: function ( p ) {
			var pow2,
				bounce = 4;

			while ( p < ( ( pow2 = Math.pow( 2, --bounce ) ) - 1 ) / 11 ) {}
			return 1 / Math.pow( 4, 3 - bounce ) - 7.5625 * Math.pow( ( pow2 * 3 - 2 ) / 22 - p, 2 );
		}
	});

	$.each( baseEasings, function( name, easeIn ) {
		$.easing[ "easeIn" + name ] = easeIn;
		$.easing[ "easeOut" + name ] = function( p ) {
			return 1 - easeIn( 1 - p );
		};
		$.easing[ "easeInOut" + name ] = function( p ) {
			return p < 0.5 ?
				easeIn( p * 2 ) / 2 :
				1 - easeIn( p * -2 + 2 ) / 2;
		};
	}); // end easing
})( jQuery );