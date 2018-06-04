/**
 * Description : 播放器样式文件
 *
 * Author : cookiej
 * Date   : 2018/6/4
 * Time   : 17:12
 */
import { StyleSheet } from 'react-native';
export default StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left:0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center'
  },
  seekBtnWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 100,
    marginLeft: 10
  },
  seekBtn: {
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    height: 26,
    width: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center'
  },
  slider: {
    flex: 1,
    marginHorizontal: 10
  },
  fullScreenBtn: {
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    height: 26,
    width: 26,
    borderRadius: 13
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left:0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15
  },
  backBtn: {
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    height: 26,
    width: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#999',
    fontSize: 15
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    justifyContent: 'space-between'
  },
  timeLabel: {
    color: '#999',
    fontSize: 12,
    width: 36,
    textAlign: 'center'
  },
  timeLine: {
    color: '#999',
    fontSize: 12
  },
  panHandlersView: {
    position: 'absolute',
    top: 40,
    left: 0,
    bottom: 40,
    right: 40,
    backgroundColor: 'transparent'
  }
});
