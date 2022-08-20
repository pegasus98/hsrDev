import React, { useState } from 'react';

export default function CustomImageBox(props: { imgurl: string,index:number,setImg:any}) {
  const [isError, setIsError] = useState(true);
  const defaultImg =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJ4AAABYCAIAAACLVtmFAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAhdEVYdENyZWF0aW9uIFRpbWUAMjAyMjowNToyMSAyMDoxNDo1OMu1q+cAAAEmSURBVHhe7dwhDsJAEEDRgu6xEEgEx6xAIjhWfRGsJqSG5uU/0/E/W7OTPW3bNkV0Ht9wSssqLau0rNKySssqLau0rNKySssqLau0rNKywJufx7KM6avb/T4mVKeWVVpWaVmlZZWWVVpWaVmlZZWWVVpWaVmlZZWWVVpWaVmlZZWWVVpWaVmlZR1x7e3HvbX/Ov7WXKeWVVpWaVmlZZWWVVpWaVmlZZWWVVpWaVmlZZWWVVrWES/11nUd0y6v53NMX12u1zHtMs/zmI6qZ0pY/ZBZpWWVllVaVmlZpWWVllVaVmlZpWWVllVaVmlZpWWVllVaVmlZpWWVlgXuRuWjU8sqLau0rNKySssqLau0rNKySssqLau0rNKySssqLau0rNKipukNz48hmQ0c1kcAAAAASUVORK5CYII=';
  const imgerrorfun = (event: any) => {
    console.log('defaultimg')
    if (isError) {
      setIsError(false);
      event.target.src = defaultImg;
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
    props.setImg(props.index)
  };
  return (
    <div style={{width:'100%',margin:'10px'}}>
      <img
        width={'100%'}
        onDrop={handleDrop}
        onDragOver={(e) => {
          let event = e as React.DragEvent;
          event.stopPropagation();
          event.preventDefault();
        }}
        draggable={false}
        src={props.imgurl}
        onError={imgerrorfun}
        alt=""
      />
    </div>
  );
}
