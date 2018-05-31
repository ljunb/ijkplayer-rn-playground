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

@property (nonatomic, copy) RCTDirectEventBlock onOrientationChange;
@property (nonatomic, copy) RCTBubblingEventBlock onChange;
@property (nonatomic, copy) RCTDirectEventBlock onPlayComplete;

@end
