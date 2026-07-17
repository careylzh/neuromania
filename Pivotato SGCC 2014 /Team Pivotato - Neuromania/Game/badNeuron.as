package {
	import flash.display.MovieClip;
	import flash.events.Event;
	import goodNeuron;
	import chain;
	import flash.utils.Timer;
	import flash.events.TimerEvent;
	import fl.transitions.Tween;
	import fl.transitions.easing.*;
	import fl.transitions.TweenEvent;
	import Main;
	import flash.geom.Point;
	import playerCon;
	import flash.filters.GlowFilter;
	public class badNeuron extends MovieClip {
		public var targetNeuron:goodNeuron;
		private var initTimer:Timer;
		public var chainTimer:Timer=new Timer(250,0);
		public var glowTimer:Timer=new Timer(100,0);
		private var theChain:chain;
		private var theMChain:chainM;
		private var chainLength:int=0;
		public var moveX:Tween;
		public var moveY:Tween;
		public var chainChain:Array=new Array();
		private var map:MovieClip;
		private var txN:int=0;
		private var tyN:int=0;
		private var pco:MovieClip;
		private var currentGlow:int=0;
		private var myGlow:GlowFilter = new GlowFilter();
		private var arraySlot:int=-1
		private var strength:int=0;
		public var strengthTimer:Timer = new Timer(1000,0);
		public function badNeuron() {
			this.addEventListener(Event.ADDED_TO_STAGE, init);
			chainTimer.addEventListener(TimerEvent.TIMER, chainTimed);
			glowTimer.addEventListener(TimerEvent.TIMER, glowTimed);
			strengthTimer.addEventListener(TimerEvent.TIMER,strengthTimed);
			myGlow.inner=true;
			myGlow.color=0xFF0000;
			myGlow.blurX=35;
			myGlow.blurY=35;
		}
		private function init(e:Event) {
			initTimer=new Timer(Main(root).rand(1000,5000),1);
			initTimer.addEventListener(TimerEvent.TIMER, initTimed);
			initTimer.start();
			Main(root).badNeurons.push(this);
		}
		private function initTimed(e:TimerEvent):void {
			while (map==null && pco==null) {
				map=MovieClip(Main(root).getChildByName("BRAINMAPOBJ"));
				pco=MovieClip(Main(root).getChildByName("playerConObj"));
			}
			findGN();
		}
		private function findGN() {
			var targetNum:int=Main(root).rand(0,Main(root).goodNeurons.length-1);
			targetNeuron=Main(root).goodNeurons[targetNum];
			txN = (targetNeuron.x - this.x) / Math.abs(targetNeuron.x - this.x);//either returns 1 or -1
			tyN = (targetNeuron.y - this.y) / Math.abs(targetNeuron.y - this.y);//to show relative direction of target
			buildChain();
		}
		private function buildChain():void {
			chainTimer.start();
			if (chainLength==0) {
				theMChain = new chainM();
				theMChain.origin=this;
				theMChain.chainNo=0;
				theMChain.x = this.x + (chainLength*theMChain.width*txN);
				theMChain.y = this.y + (chainLength*theMChain.height*tyN);
				map.addChild(theMChain);
				chainChain.push(theMChain);
				theMChain.rotation = ((Math.atan2(targetNeuron.y - this.y,targetNeuron.x - this.x))* 180 / Math.PI) - 90;
			} else {
				theChain = new chain();
				theChain.origin=this;
				theChain.chainNo=chainLength;
				theChain.x = this.x + (chainLength*theChain.width*txN);
				theChain.y = this.y + (chainLength*theChain.height*tyN);
				map.addChild(theChain);
				chainChain.push(theChain);
				theChain.rotation = ((Math.atan2(targetNeuron.y - this.y,targetNeuron.x - this.x))* 180 / Math.PI) - 90;
			}
			chainLength++;
		}
		private function chainTimed(e:TimerEvent):void {
			buildChain();
		}
		public function cutChain(number:int) {
			chainTimer.stop();
			for (var i:int=number; i<chainChain.length; i++) {
				Main(root).res+=1;
				map.removeChild(chainChain[i]);
				Main(root).badBroken++;
			}
			chainLength=number;
			chainChain.splice(number, chainChain.length - number);
			if(number==0){
				initTimer.start();
			}else{
				chainTimer.start();
			}
			strength=0;
			strengthTimer.stop();
			Main(root).badStrengthArray[arraySlot]=strength;
		}
		public function testCut():void {
			glowTimer.stop();
			currentGlow=0;
			if (pco!=null) {
				var pcoPoint:Point=map.globalToLocal(new Point(pco.x,pco.y));
				for (var i:int=0; i<chainChain.length; i++) {
					if (chain(chainChain[i])!=null) {
						if (Math.abs(chain(chainChain[i]).x-pcoPoint.x)<75&&Math.abs(chain(chainChain[i]).y-pcoPoint.y)<180) {
							if (chain(chainChain[i]).hitTestObject(pco)) {
								cutChain(i);
								break;
							}
						}
					}
				}
			}
		}
		public function endChain():void {
			chainTimer.stop();
			theMChain = new chainM();
			theMChain.origin=this;
			theMChain.chainNo=0;
			theMChain.x = this.x + (chainLength*theChain.width*txN) + theMChain.width/2*txN;
			theMChain.y = this.y + (chainLength*theChain.height*tyN) + theMChain.height/2*tyN;
			map.addChild(theMChain);
			chainChain.push(theMChain);
			theMChain.rotation = ((Math.atan2(targetNeuron.y - this.y,targetNeuron.x - this.x))* 180 / Math.PI) - 90;
			chainLength++;
			glowTimer.start();
			strengthTimer.start();
		}
		private function glowTimed(e:TimerEvent):void {
			if (currentGlow>0) {
				chain(chainChain[currentGlow-1]).filters=[];
			}
			if (currentGlow==chainLength) {
				currentGlow=0;
			}
			chain(chainChain[currentGlow]).filters=[myGlow];
			currentGlow++;
		}
		private function strengthTimed(e:TimerEvent):void{
			if(arraySlot==-1){
				arraySlot=Main(root).badStrengthArray.length;
				strength=chainChain.length;
				Main(root).badStrengthArray[arraySlot]=strength;
			}else{
				strength=chainChain.length*(strengthTimer.currentCount+1);
				Main(root).badStrengthArray[arraySlot]=strength;
			}
		}
	}
}