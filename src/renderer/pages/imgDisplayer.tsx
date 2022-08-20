import { Card, Col, Divider, Image, Layout, List, Row, Space } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import React, { Component } from 'react';
import { Template } from 'webpack';
import CustomImageBox from '../components/imgbox';



export default class ImgDisplayer extends Component {
  state = {
    imgUrlList: [
    ] as string[],
    dragSrc: '' as string,
    row:1,
    col:2,
    listUrlList: [...new Array(10).keys()].map(item=>'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJ4AAABYCAIAAACLVtmFAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAhdEVYdENyZWF0aW9uIFRpbWUAMjAyMjowNToyMSAyMDoxNDo1OMu1q+cAAAEmSURBVHhe7dwhDsJAEEDRgu6xEEgEx6xAIjhWfRGsJqSG5uU/0/E/W7OTPW3bNkV0Ht9wSssqLau0rNKySssqLau0rNKySssqLau0rNKywJufx7KM6avb/T4mVKeWVVpWaVmlZZWWVVpWaVmlZZWWVVpWaVmlZZWWVVpWaVmlZZWWVVpWaVmlZR1x7e3HvbX/Ov7WXKeWVVpWaVmlZZWWVVpWaVmlZZWWVVpWaVmlZZWWVVrWES/11nUd0y6v53NMX12u1zHtMs/zmI6qZ0pY/ZBZpWWVllVaVmlZpWWVllVaVmlZpWWVllVaVmlZpWWVllVaVmlZpWWVlgXuRuWjU8sqLau0rNKySssqLau0rNKySssqLau0rNKySssqLau0rNKipukNz48hmQ0c1kcAAAAASUVORK5CYII='),
  };

  constructor(props: any) {
    super(props);
    let that = this;

    window.jsBridge.once(
      'init',
      (data:{col:number,row:number})=>{
        console.log(data)
        that.setState({row:data.row,col:data.col})
      }
    )

    window.jsBridge.on('sendImgSrc', (data: { imgData: any; code: number }) => {
      var file = new File([data.imgData], 'anyname.png', { type: 'image/png' });
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function (e) {
        let newList = that.state.imgUrlList;
        if (typeof this.result == 'string') newList.push(this.result);
        that.setState({ imgUrlList: newList });
      };
    });
  }

  handleDragStart(event: React.DragEvent) {
    let dragItem = event.target as HTMLElement;
    if (dragItem.childElementCount > 0)
      dragItem.childNodes.forEach((item) => {
        if (item.nodeName === 'IMG') {
          let imgItem = item as HTMLImageElement;
          let imgSrc = imgItem.src as string;
          this.setState({ dragSrc: imgSrc });
        }
      });
  }

setImg(index:number){
  this.setState({listUrlList:this.state.listUrlList.map((item,idx)=>idx===index?this.state.dragSrc:item)})
}
  
createBoxes(row: number,col:number) {

  let test =[...new Array(row*col).keys()].map((index: number) => {
    let tmpsrc =this.state.listUrlList[index];
    console.log(this.state.listUrlList)
    return (
      <CustomImageBox imgurl={tmpsrc} index={index} setImg={this.setImg}></CustomImageBox>)
  });
  return test
};
  render() {
    this.handleDragStart = this.handleDragStart.bind(this);
    this.setImg=this.setImg.bind(this)
    return (
      <Layout>
        <Content>
          <Row style={{ height: '100%', minHeight: '100%' }} justify="center" gutter={8}>
            <Col span={6} style={{ border: 5 }}>
              <div style={{overflowY:'scroll',height:'100vh'}}>
                <List
                  dataSource={this.state.imgUrlList}
                  renderItem={(item) => (
                    <List.Item>
                      <Image
                        src={item}
                        draggable
                        onDragStart={this.handleDragStart}
                      ></Image>
                    </List.Item>
                  )}
                ></List>
                </div>
            </Col>
            <Col span={18} >
              <List grid={{ gutter: 16, column: this.state.col }} dataSource={this.createBoxes(this.state.row,this.state.col)}
              renderItem={(item:HTMLElement) => (
                <List.Item>
                  {item}
                </List.Item>
              )}
              >
              </List>
            </Col>
          </Row>
        </Content>
      </Layout>
    );
  }
}
