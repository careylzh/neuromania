package {
	import flash.display.MovieClip;
	import flash.display.DisplayObject;
	import flash.events.Event;
	import Main;
	import badNeuron;
	import flash.utils.getQualifiedClassName;
	import flash.events.MouseEvent;
	public class chain extends MovieClip {
		public var origin:badNeuron;
		public var chainNo:int;
		public function chain() {
			this.addEventListener(Event.ADDED_TO_STAGE,init);
		}
		private function init(e:Event):void{
			if(this.hitTestObject(origin.targetNeuron) && (getQualifiedClassName(this)=="chain")){
				origin.endChain();
			}
			this.removeEventListener(Event.ADDED_TO_STAGE,init);
		}
	}
}