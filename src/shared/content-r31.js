import {ContentLesson as PreviousLesson} from './content-r30.js';
export {FRIEND_NAMES,PASSENGER_NAMES,FRIEND_NUMBERS} from './content-r30.js';

export class ContentLesson extends PreviousLesson {
 update(seconds){
  const crossed=this.crossed,looked={...this.looked},viewVisit={...this.viewVisit};
  super.update(seconds);
  // A person arriving does not introduce a vehicle. Only the vehicle event
  // invalidates its own lane; looking across the road never expires a check.
  if(this.kind==='crossing'&&this.crossed>crossed){
   this.viewVisit=viewVisit;
   this.looked={left:looked.left,right:looked.right};
   if(this.staleSide)this.looked[this.staleSide]=false;
   this.lookStep=Number(this.looked.left)+Number(this.looked.right);
  }
 }
 snapshot(){return {...super.snapshot(),contentVersion:31};}
}
