import React, { Component } from "react";
import Slider from "react-slick";
import ImgBox from "../components/imgbox"
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import "./imgwindow.css"
export default class ImgContainer extends Component {
  state={
    imgListLen:0,
    imgUrlList:[] as string[],
  }
  constructor(props:any){
    super(props);
    let that = this;
    window.jsBridge.once(
      'init',
      (data:{imgListLen:number})=>{
        console.log(data)
        that.setState({imgListLen:data.imgListLen})
        console.log(this.state.imgListLen)
      }
    )
    window.jsBridge.on(
      'sendImgSrc',
      (data:{imgData:any,code:number})=>{
        var file = new File([data.imgData], 'anyname.png', { type: 'image/png' });
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload=function(e){
          let newList = that.state.imgUrlList;
          if(typeof(this.result)=="string")
            newList.push(this.result)
          console.log(newList)
          that.setState({imgUrlList:newList})
          console.log(that.state.imgUrlList)
        }
       
      }
    )
  }
  
createBoxes(len: number) {
  console.log(this.state.imgUrlList)

  let test =[...new Array(len).keys()].map((index: number) => {
    let tmpsrc =index<this.state.imgUrlList.length? this.state.imgUrlList[index]:'';
    return (
      <div key={index} style={{'justifyContent':'center'}}>
        <ImgBox imgurl={tmpsrc}/>
      </div>
    );
  });
  return test
};
  render() {
    this.createBoxes = this.createBoxes.bind(this);
    const settings = {
      dots: true,
      
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
    };
    return (
      <div>
        <Slider {...settings}>
          {this.createBoxes(this.state.imgListLen)}
        </Slider>
      </div>
    );
  }
}

