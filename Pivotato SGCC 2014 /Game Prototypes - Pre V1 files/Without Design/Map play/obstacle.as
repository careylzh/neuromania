package  {
	
	import flash.display.MovieClip;
	import flash.events.Event;
	import Main;
	import flash.geom.Point;
	public class obstacle extends MovieClip {
		private var hit:Boolean = false;
		private var cD:Array;
		private var existence:int;
		private var a:int = 0;
		public function obstacle() {
			this.addEventListener(Event.ADDED_TO_STAGE, initiation);
		}
		private function initiation(e:Event):void{
			existence = MovieClip(this.parent).currentFrame;
			this.addEventListener(Event.ENTER_FRAME, frameLoop);
		}
		private function frameLoop(e:Event):void{
			if(this.stage){
			if(this.hitTestObject(MovieClip(MovieClip(Main(root).getChildByName("playerObj")).getChildByName("playerHitbox")))){	
				cD=Main(root).collisionFrom(this.localToGlobal(new Point(this.x,this.y)),new Point(MovieClip(MovieClip(Main(root).getChildByName("playerObj")).getChildByName("playerHitbox")).x,MovieClip(MovieClip(Main(root).getChildByName("playerObj")).getChildByName("playerHitbox")).y));
				for(var i:int=0;i<4;i++){
					if(cD[i]==true){
						MovieClip(Main(root).getChildByName("playerObj")).blocked[i]=cD[i];
					}
				}
			}
			}else{
				termination();
			}
		}
		private function termination():void{
			this.removeEventListener(Event.ADDED_TO_STAGE,initiation);
			this.removeEventListener(Event.ENTER_FRAME,frameLoop);
		}
	}
	
}
