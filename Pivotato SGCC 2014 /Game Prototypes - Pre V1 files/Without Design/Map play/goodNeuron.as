package {
	import flash.display.MovieClip;
	import flash.events.Event;
	import Main;
	public class goodNeuron extends MovieClip{
		public function goodNeuron() {
			this.addEventListener(Event.ADDED_TO_STAGE, init);
		}
		private function init(e:Event){
			Main(root).goodNeurons.push(this);
		}
	}
}