/**
 * Description : 默认的亮度调节组件
 *
 * Author : cookiej
 * Date   : 2018/6/5
 * Time   : 10:42
 */
import React, { PureComponent } from 'react';
import {
  View,
  Animated,
  StyleSheet
} from 'react-native';

const BrightnessLineWidth = 200;
const styles = StyleSheet.create({
  container: {
    width: BrightnessLineWidth,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    color: '#fff'
  },
  bgLine: {
    marginTop: 10,
    height: 2,
    width: BrightnessLineWidth,
    backgroundColor: '#999'
  },
  brightness: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#fff'
  }
});

export default class DefaultBrightnessLine extends PureComponent {
  constructor(props) {
    super(props);
    this.value = 0;
    this.animationValue = new Animated.Value(0);
    this.animationValue.addListener(({value}) => this.value = value);
  }

  updateBrightness = brightness => {
    this.animationValue.setValue(brightness);
    this.forceUpdate();
  };

  render() {
    const lineWidth = this.animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, BrightnessLineWidth]
    });
    const brightness = parseInt(this.value * 100);

    return (
      <View style={styles.container}>
        <Animated.Text style={styles.title}>亮度：{brightness}%</Animated.Text>
        <View style={styles.bgLine}>
          <Animated.View style={[styles.brightness, { width: lineWidth }]}/>
        </View>
      </View>
    )
  }
}