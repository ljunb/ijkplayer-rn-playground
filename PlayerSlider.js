/**
 * Description : 播放器slider
 *
 * Author : cookiej
 * Date   : 2018/6/1
 * Time   : 11:10
 */
import React, { PureComponent } from 'react';
import {
  View,
  StyleSheet,
  PanResponder
} from 'react-native';

const styles = StyleSheet.create({
  slider: {
    height: 20,
    // backgroundColor: 'black'
  },
  bgLine: {
    height: 2,
    backgroundColor: '#ccc',
    position: 'absolute',
    left: 0,
    right: 0,
    top: (20 - 2) / 2
  },
  progress: {
    backgroundColor: 'red',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0
  },
  circle: {
    backgroundColor: '#fff',
    position: 'absolute',
    left: 0,
    height: 10,
    width: 10,
    borderRadius: 5,
    top: 5
  }
});

export default class PlayerSlider extends PureComponent {
  constructor(props) {
    super(props);
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: this.handleResponderGrant,
      onPanResponderMove: this.handlePanResponderMove,
    });
    this.sliderWidth = 0;
    this.currentProgress = 0;
    this.currentTime = 0;
  }

  /**
   * 更新圆圈位置
   * @param value 0-1
   */
  updateCircle = value => {
    this.currentTime = value;
    this.circle && this.circle.setNativeProps({left: this.sliderWidth * value});
  };

  /**
   * 更新缓冲进度
   * @param progress 0-1
   */
  updateProgress = progress => {
    const offsetX = (this.sliderWidth * progress);
    this.currentProgress = progress;
    this.progressLine && this.progressLine.setNativeProps({width: offsetX});
  };

  handleResponderGrant = (evt, ges) => {
    const { locationX } = evt.nativeEvent;
    console.log(`Grant: ${locationX}`);

    const progressWidth = this.sliderWidth * this.currentProgress / 100;
    const offsetX = progressWidth < locationX ? progressWidth : locationX;
    this.circle && this.circle.setNativeProps({left: offsetX});
  };

  handlePanResponderMove = (evt, ges) => {
    // 往右滑，快进
    let newOffsetX = 0;
    // if (newOffsetX < 0) {
    //   newOffsetX = 0;
    // } else if (newOffsetX > this.currentProgress) {
    //   newOffsetX = this.currentProgress;
    // }
    if (ges.vx > 0) {
      newOffsetX = this.currentTime + ges.dx;
    } else {
      newOffsetX = this.currentTime - ges.dx;
    }
    if (newOffsetX < 0) {
      newOffsetX = 0;
    } else if (newOffsetX > this.currentProgress) {
      newOffsetX = this.currentProgress;
    }
    this.currentTime = newOffsetX;
    this.circle && this.circle.setNativeProps({left: newOffsetX});

    console.log(`Move: dx(${ges.dx}), vx(${ges.vx}), moveX(${ges.moveX})`);
  };

  handleLayout = evt => {
    const {width} = evt.nativeEvent.layout;
    if (width !== this.sliderWidth) {
      this.sliderWidth = width;
      this.updateProgress(this.currentProgress);
      this.updateCircle(this.currentTime);
    }
  };

  render() {
    return (
      <View
        style={[styles.slider, this.props.style]}
        onLayout={this.handleLayout}
        {...this.panResponder.panHandlers}
      >
        <View style={styles.bgLine}>
          <View ref={r => this.progressLine = r} style={styles.progress}/>
        </View>
        <View ref={r => this.circle = r} style={styles.circle}/>
      </View>
    )
  }
}