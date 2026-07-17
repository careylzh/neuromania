package {
	import flash.display.MovieClip;
	import Main;
	import goodNeuron;
	import gChain;
	import flash.utils.Timer;
	import flash.events.TimerEvent;
	import flash.filters.GlowFilter;
	public class gChainM extends gChain {
		public var chainChain:Array=new Array();
		public var origin:goodNeuron;
		private var glowTimer:Timer = new Timer(50,0);
		public var strengthTimer:Timer = new Timer(1000,10);
		private var myGlow:GlowFilter = new GlowFilter();
		private var currentGlow:int=0;
		private var arraySlot:int=-1;
		private var strength:int=0;
		public function gChainM() {
			strengthTimer.addEventListener(TimerEvent.TIMER,strengthTimed);
		}
		public function checkConnection():Boolean {
			var checkResult:Boolean=false;
			for (var i:int=0; i<Main(root).goodNeurons.length; i++) {
				if (this.hitTestObject(goodNeuron(Main(root).goodNeurons[i]))) {
					origin=goodNeuron(Main(root).goodNeurons[i]);
					checkResult=true;
					break;
				}
			}
			return checkResult;
		}
		public function startGlow():void {
			glowTimer.start();
			glowTimer.addEventListener(TimerEvent.TIMER, glowTimed);
			myGlow.inner=true;
			myGlow.color=0x0000FF;
			myGlow.blurX=35;
			myGlow.blurY=35;
		}

		private function glowTimed(e:TimerEvent):void {
			if (currentGlow>0) {
				gChain(chainChain[currentGlow-1]).filters=[];
			}
			if (currentGlow==chainChain.length) {
				currentGlow=0;
			}
			gChain(chainChain[currentGlow]).filters=[myGlow];
			currentGlow++;
		}
		private function strengthTimed(e:TimerEvent):void{
			if(arraySlot==-1){
				arraySlot=Main(root).goodStrengthArray.length;
				strength=chainChain.length;
				Main(root).goodStrengthArray[arraySlot]=strength;
			}else{
				strength=chainChain.length*(strengthTimer.currentCount+1);
				Main(root).goodStrengthArray[arraySlot]=strength;
			}
		}
	}

}