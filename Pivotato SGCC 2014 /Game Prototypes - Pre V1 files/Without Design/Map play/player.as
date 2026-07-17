package {
	import flash.display.MovieClip;
	import flash.display.DisplayObject;
	import flash.events.KeyboardEvent;
	import flash.ui.Keyboard;
	import flash.events.Event;
	import fl.transitions.Tween;
	import fl.transitions.easing.*;
	import fl.transitions.TweenEvent;
	import flash.geom.Point;
	import flash.text.TextField;
	import XMLData;
	public class player extends MovieClip {
		private var map:MovieClip;
		private var keys:Array = new Array();
		private var mapTween:Tween;
		public var nextMap:String;
		public var active:Boolean;
		public var blocked:Array=new Array(4);
		private var globalPoint:Point;
		public var currentDir:Array=new Array(4);
		private var targetP:Point;
		public function player() {
			initiate();
			trace("yay");
			while (map==null) {
				map=MovieClip(Main(root).getChildByName("MAP"));
			}
			mapTween=new Tween(map,"alpha",None.easeNone,0,1,0.5,true);
		}
		public function initiate():void {
			active=true;
			this.alpha=1;
			stage.addEventListener(KeyboardEvent.KEY_DOWN, keydown);
			stage.addEventListener(KeyboardEvent.KEY_UP, keyup);
			stage.addEventListener(Event.ENTER_FRAME, frameLoop);
		}
		public function terminate(fade:Boolean):void {
			active=false;
			if (fade==true) {
				this.alpha=0;
			}
			stage.removeEventListener(KeyboardEvent.KEY_DOWN, keydown);
			stage.removeEventListener(KeyboardEvent.KEY_UP, keyup);
			stage.removeEventListener(Event.ENTER_FRAME, frameLoop);
		}
		private function keydown(e:KeyboardEvent):void {
			keys[e.keyCode]=true;
			if (keys[Keyboard.E]) {
				keys[Keyboard.E]=false;
				if (map.currentLabel=="stage1") {
					if (this.hitTestObject(MovieClip(map.getChildByName("evilperson")))) {
						MovieClip(Main(root).getChildByName("dialogueBox")).y=688;
						terminate(false);
						Main(root).whichScene = "GLUE_SNIFF_START";
						Main(root).battleNext = true;
						TextField(MovieClip(Main(root).getChildByName("dialogueBox")).wordBox).text = XMLData.lines.GLUE_SNIFF_START.SPEECH[0];
						stage.addEventListener(KeyboardEvent.KEY_DOWN,Main(root).nextLine);
					}
				}
			}
		}
		private function changeMap(step:int):void {
			if (step==1) {
				mapTween=new Tween(map,"alpha",None.easeNone,1,0,0.75,true);
				mapTween.addEventListener(TweenEvent.MOTION_FINISH, mapTweenEnd1);
				terminate(true);
			} else if (step==2) {
				mapTween=new Tween(map,"alpha",None.easeNone,0,1,0.75,true);
				mapTween.addEventListener(TweenEvent.MOTION_FINISH, mapTweenEnd2);
			}
		}
		private function mapTweenEnd1(e:TweenEvent):void {
			map.gotoAndStop(nextMap);
			changeMap(2);
			mapTween.removeEventListener(TweenEvent.MOTION_FINISH, mapTweenEnd1);
		}
		private function mapTweenEnd2(e:TweenEvent):void {
			initiate();
			globalPoint=map.localToGlobal(targetP);
			this.x=globalPoint.x;
			this.y=globalPoint.y;
			mapTween.removeEventListener(TweenEvent.MOTION_FINISH, mapTweenEnd2);
		}
		private function keyup(e:KeyboardEvent):void {
			keys[e.keyCode]=false;
			if (this.currentLabel=="DownWalk") {
				this.gotoAndPlay(2);
			} else if (this.currentLabel=="UpWalk") {
				this.gotoAndPlay("UpIdle");
			} else if (this.currentLabel=="LeftWalk") {
				this.gotoAndPlay("LeftIdle");
			} else if (this.currentLabel=="RightWalk") {
				this.gotoAndPlay("RightIdle");
			} else if (this.currentLabel=="TopLeftWalk") {
				this.gotoAndPlay("TopLeftIdle");
			} else if (this.currentLabel=="TopRightWalk") {
				this.gotoAndPlay("TopRightIdle");
			} else if (this.currentLabel=="BottomLeftWalk") {
				this.gotoAndPlay("BottomLeftIdle");
			} else if (this.currentLabel=="BottomRightWalk") {
				this.gotoAndPlay("BottomRightIdle");
			}
		}
		private function frameLoop(e:Event):void {
			if (keys[Keyboard.UP]&&keys[Keyboard.RIGHT]&&blocked[0]!=true&&blocked[1]!=true) {
				if (this.currentLabel!="TopRightWalk") {
					this.gotoAndPlay("TopRightWalk");
				}
				moveUp();
				moveRight();
			} else if (keys[Keyboard.UP] && keys[Keyboard.LEFT]&&blocked[2]!=true&&blocked[1]!=true) {
				if (this.currentLabel!="TopLeftWalk") {
					this.gotoAndPlay("TopLeftWalk");
				}
				moveUp();
				moveLeft();
			} else if (keys[Keyboard.DOWN] && keys[Keyboard.LEFT&&blocked[2]!=true&&blocked[3]!=true]) {
				if (this.currentLabel!="BottomLeftWalk") {
					this.gotoAndPlay("BottomLeftWalk");
				}
				moveDown();
				moveLeft();
			} else if (keys[Keyboard.DOWN] && keys[Keyboard.RIGHT]&&blocked[0]!=true&&blocked[3]!=true) {
				if (this.currentLabel!="BottomRightWalk") {
					this.gotoAndPlay("BottomRightWalk");
				}
				moveDown();
				moveRight();
			} else if (keys[Keyboard.UP]&&blocked[1]!=true) {
				if (this.currentLabel!="UpWalk") {
					this.gotoAndPlay("UpWalk");
				}
				moveUp();
			} else if (keys[Keyboard.LEFT]&&blocked[2]!=true) {
				if (this.currentLabel!="LeftWalk") {
					this.gotoAndPlay("LeftWalk");
				}
				moveLeft();
			} else if (keys[Keyboard.DOWN]&&blocked[3]!=true) {
				if (this.currentLabel!="DownWalk") {
					this.gotoAndPlay("DownWalk");
				}
				moveDown();
			} else if (keys[Keyboard.RIGHT]&&blocked[0]!=true) {
				if (this.currentLabel!=="RightWalk") {
					this.gotoAndPlay("RightWalk");
				}
				moveRight();
			}
		}
		private function moveLeft():void {
			blocked[0]=false;
			blocked[1]=false;
			blocked[3]=false;
			if (this.x>=512) {
				this.x-=15;
			} else if ((map.x<(map.width/2))) {
				map.x+=15;
			} else if (this.x<=512) {
				this.x-=15;
			}
		}
		private function moveRight():void {
			blocked[2]=false;
			blocked[1]=false;
			blocked[3]=false;
			if (this.x<=384) {
				this.x+=15;
			} else if (map.x>(1024-(map.width)/2)) {
				map.x-=15;
			} else if (this.x>=384) {
				this.x+=15;
			}
		}
		private function moveDown():void {
			blocked[0]=false;
			blocked[1]=false;
			blocked[2]=false;
			if (this.y<=384) {
				this.y+=15;
			} else if (map.y>(768-(map.height)/2)) {
				map.y-=15;
			} else if (this.y>=384) {
				this.y+=15;
			}
		}
		private function moveUp():void {
			blocked[0]=false;
			blocked[2]=false;
			blocked[3]=false;
			if (this.y>=384) {
				this.y-=15;
			} else if ((map.y<(map.height/2))) {
				map.y+=15;
			} else if (this.y<=384) {
				this.y-=15;
			}
		}
	}

}