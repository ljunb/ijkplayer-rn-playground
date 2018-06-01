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
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  slider: {
    height: 20
  },
  bgLine: {
    height: 2,
    backgroundColor: '#aaa',
    position: 'absolute',
    left: 0,
    right: 0,
    top: (20 - 2) / 2
  },
  buffer: {
    backgroundColor: '#fff',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0
  },
  indicatorBorder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    position: 'absolute',
    left: 0,
    height: 12,
    width: 12,
    borderRadius: 6,
    top: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  indicator: {
    backgroundColor: '#fff',
    height: 8,
    width: 8,
    borderRadius: 4
  }
});

export default class PlayerSlider extends PureComponent {
  static propTypes = {
    onSeekTimeBegin: PropTypes.func,
    onSeekingTime: PropTypes.func,
    onSeekTimeEnd: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: this.handleResponderGrant,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderRelease,
    });
    this.sliderWidth = 0; // 布局完成后滑条宽度
    this.bufferValue = 0; // 缓冲进度比例，0~1
    this.indicatorValue = 0; // 当前滑条的变化值，影响圆圈指示器位置，0~1
  }

  /**
   * 更新圆圈位置
   * @param value 0~1
   */
  updateIndicator = value => {
    this.indicatorValue = value;
    this.indicator && this.indicator.setNativeProps({left: this.sliderWidth * value});
  };

  /**
   * 更新缓冲进度
   * @param value 0-1
   */
  updateBuffer = value => {
    this.bufferValue = value;
    this.bufferLine && this.bufferLine.setNativeProps({width: this.sliderWidth * value});
  };

  handleResponderGrant = (evt, ges) => {
    const { locationX } = evt.nativeEvent;

    const bufferWidth = this.sliderWidth * this.bufferValue;
    const offsetX = bufferWidth < locationX ? bufferWidth : locationX;
    this.indicator && this.indicator.setNativeProps({left: offsetX});

    // 当前时间
    this.indicatorValue = offsetX / this.sliderWidth;
    this.props.onSeekTimeBegin && this.props.onSeekTimeBegin({value: this.indicatorValue});
  };

  handlePanResponderMove = (evt, ges) => {
    let indicatorValue = evt.nativeEvent.locationX / this.sliderWidth;
    if (indicatorValue < 0) {
      indicatorValue = 0;
    } else if (indicatorValue > this.bufferValue) {
      indicatorValue = this.bufferValue;
    } else if (indicatorValue > 1) {
      indicatorValue = 1;
    }
    // 更新圆圈指示器位置
    this.updateIndicator(indicatorValue);
    this.props.onSeekingTime && this.props.onSeekingTime({value: indicatorValue});
  };

  /**
   * 滑条滑动结束
   */
  handlePanResponderRelease = () => {
    this.props.onSeekTimeEnd && this.props.onSeekTimeEnd({value: this.indicatorValue});
  };

  /**
   * 布局回调，更新整体UI
   */
  handleLayout = evt => {
    const {width} = evt.nativeEvent.layout;
    if (width !== this.sliderWidth) {
      this.sliderWidth = width;
      this.updateBuffer(this.bufferValue);
      this.updateIndicator(this.indicatorValue);
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
          <View ref={r => this.bufferLine = r} style={styles.buffer}/>
        </View>
        <View ref={r => this.indicator = r} style={styles.indicatorBorder}>
          <View style={styles.indicator}/>
        </View>
      </View>
    )
  }
}