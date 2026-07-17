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
	public class badNeuron extends MovieClip {
		private var targetNeuron:goodNeuron;
		private var initTimer:Timer;
		public var chainTimer:Timer=new Timer(1000,0);
		private var theChain:chain;
		private var chainLength:int = 0;
		public var moveX:Tween;
		public var moveY:Tween;
		public var chainChain:Array = new Array;
		private var map:MovieClip;
		public function badNeuron() {
			this.addEventListener(Event.ADDED_TO_STAGE, init);
			chainTimer.addEventListener(TimerEvent.TIMER, chainTimed);
		}
		private function init(e:Event) {
			initTimer = new Timer(Main(root).rand(1000,5000),1);
			initTimer.addEventListener(TimerEvent.TIMER, initTimed);
			initTimer.start();
		}
		private function initTimed(e:TimerEvent):void {
			map=MovieClip(Main(root).getChildByName("BRAINMAPOBJ"))
			findGN();
		}
		private function findGN() {
			var targetNum:int = Main(root).rand(0,Main(root).goodNeurons.length-1);
			targetNeuron=Main(root).goodNeurons[targetNum];
			trace(targetNeuron.parent.name);
			trace(targetNum, targetNeuron.x, targetNeuron.y);
			moveX = new Tween(this, "x", null, this.x, targetNeuron.x - Main(root).rand(-150,150), 0.5, true);
			moveY = new Tween(this, "y", null, this.y, targetNeuron.y - Main(root).rand(-150,150), 0.5, true);
			moveX.addEventListener(TweenEvent.MOTION_FINISH, startbuildChain);
			for(var i:int=0;i<Main(root).goodNeurons.length;i++){
				trace(Main(root).goodNeurons[i].x);
			}
		}
		private function startbuildChain(e:TweenEvent):void{
			buildChain();
		}
		private function buildChain():void{
			chainTimer.start();
			theChain = new chain();
			theChain.origin = this;
			theChain.chainNo = chainLength;
			theChain.x = this.x + (chainLength*((targetNeuron.x - this.x)/theChain.width)) + theChain.width/2;
			theChain.y = this.y + (chainLength*((targetNeuron.y - this.y)/theChain.height)) + theChain.height/2;
			trace(targetNeuron.x);
			map.addChild(theChain);
			chainChain.push(theChain);
			theChain.rotation = ((Math.atan2(targetNeuron.y - this.y,targetNeuron.x - this.x))* 180 / Math.PI) - 90;
			chainLength++;
		}
		private function chainTimed(e:TimerEvent):void {
			buildChain();
		}
		public function cutChain(number:int){
			chainTimer.stop();
			for(var i:int=number;i<chainChain.length;i++){
				Main(root).removeChild(chainChain[i]);
			}
			chainLength=number;
			chainChain.splice(number, chainChain.length - number);
			trace(chainChain);
			chainTimer.start();
		}
	}
}