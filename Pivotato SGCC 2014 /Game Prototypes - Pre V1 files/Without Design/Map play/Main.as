package {
	import flash.display.MovieClip;
	import flash.display.StageScaleMode;
	import flash.display.BitmapData;
	import flash.display.DisplayObjectContainer;
	import flash.geom.Matrix;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.events.Event;
	import XMLData;
	import fl.transitions.Tween;
	import fl.transitions.easing.*;
	import fl.transitions.TweenEvent;
	import flash.events.TimerEvent;
	import flash.utils.Timer;
	import flash.events.KeyboardEvent;

	public class Main extends MovieClip {
		private var dBTween:Tween;
		private var atLine:int=0;
		public var whichScene:String;
		public var battleNext:Boolean;
		private var tempLine:String;
		public var goodNeurons:Array = new Array();
		public function Main() {
			stage.scaleMode=StageScaleMode.SHOW_ALL;
			startGame();
		}
		public function rand(minNum:Number, maxNum:Number):Number {
			return (Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
		}
		public function collisionFrom(sP:Point,mP:Point):Array {
			//NOTE: THIS FUNCTION ACTUALLY RETURNS WHERE THE OBSTACLE IS
			var returnValue:Array=new Array(4);
			var d:Point=new Point(0,0);
			d.x=sP.x-mP.x;
			d.y=sP.y-mP.y;
			if (d.x>0) {
				returnValue[0]=true;
			}
			if (d.y<0) {
				returnValue[1]=true;
			}
			if (d.x<0) {
				returnValue[2]=true;
			}
			if (d.y>0) {
				returnValue[3]=true;
			}
			return returnValue;
		}
		public function startGame():void{
			dBTween=new Tween(dialogueBox,"y",Strong.easeOut,950,688,1,true);
			dBTween.addEventListener(TweenEvent.MOTION_FINISH, dBTweenEnd);
			playerObj.terminate(false);
		}
		public function dBTweenEnd(e:TweenEvent):void {
			dBTween.removeEventListener(TweenEvent.MOTION_FINISH, dBTweenEnd)
			trace("a")
			var myTimer:Timer = new Timer(2000,3);
			myTimer.start();
			myTimer.addEventListener(TimerEvent.TIMER, timerListener);
			myTimer.addEventListener(TimerEvent.TIMER_COMPLETE, timerComplete);
		}
		public function timerListener(e:TimerEvent):void {
			dialogueBox.wordBox.text = XMLData.lines.GAME_START.SPEECH[atLine];
			atLine++;
			trace(dialogueBox.wordBox.text);
		}
		public function timerComplete(e:TimerEvent):void {
			dBTween = new Tween(dialogueBox,"y",Strong.easeOut,688,950,1,true);
			playerObj.initiate();
			atLine=0;
		}
		public function nextLine(e:KeyboardEvent):void{
			tempLine = XMLData.lines.child(whichScene).SPEECH[++atLine];
			if(tempLine!=null){
				dialogueBox.wordBox.text = tempLine;
			}else if(tempLine==null){
				stage.removeEventListener(KeyboardEvent.KEY_DOWN,Main(root).nextLine);
				dialogueBox.y = 950;
				atLine=0;
				if(battleNext==true){
					gotoAndStop(2);
				}else{
					playerObj.initiate();
				}
			}
		}
	}
}