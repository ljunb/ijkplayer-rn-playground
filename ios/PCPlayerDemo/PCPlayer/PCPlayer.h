//
//  PCPlayer.h
//  PCPlayerDemo
//
//  Created by CookieJ on 2018/5/30.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>

@interface PCPlayer : UIView

+ (instancetype)player;

@property (nonatomic, copy) RCTDirectEventBlock onLoadStateDidChange;
@property (nonatomic, copy) RCTDirectEventBlock onOrientationChange;
@property (nonatomic, copy) RCTBubblingEventBlock onPlaying;
@property (nonatomic, copy) RCTDirectEventBlock onPlayComplete;
@property (nonatomic, copy) RCTBubblingEventBlock onVolumeChange;
@property (nonatomic, copy) RCTBubblingEventBlock onBrightnessChange;

@end
