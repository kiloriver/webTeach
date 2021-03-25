'use strict';
const fs = require("fs");
const { EventEmitter } = require('events');
const logger = require('../logger').logger('webTeach-room');

class liveRoom{
    constructor(data){
        this.state = data;
        logger.debug('new room %d',this.state.id);
        this.rtcManager = new Map();
        this.lesson = "default";
        this.state.teacherCount = 0;
        this.state.studentCount = 0;
        this.state.num = 0;
        this.broadcaster = new EventEmitter({'room':this.state.id});
    };

    init = ()=>{
        return new Promise((resolve,reject)=>{
            const id = this.state.id;
            const file = 'index_' + id + '.html';
            const dir = "C:/source/projects/webTeach/view/"; 
            fs.copyFile("C:/source/projects/webTeach/view/index.html", dir + file,(err)=>{
                if(err){
                    logger.error('initRoom happens error %s' ,JSON.stringify(err));
                    reject(err);
                    return;
                }
                
                fs.appendFile(dir+file, `<script>window.roomid =${id} </script>`, er => {
                    if (er) {
                        reject(er);
                        return;
                    }
                    resolve(0);
                });
            });
        });        
    };
    enter = (role)=>{
        logger.debug('room enter role:%s',role);
        if(role === 'teacher') 
        {
            logger.debug('room enter teacher count：%d',this.state.teacherCount);
            if(this.state.teacherCount === 1)return false;
            this.state.teacherCount = 1;
        }
        
        const curNum = this.state.num || 0;
        const maxNum = this.state.max || 10; 
        if(curNum > maxNum) return false;
        this.state.num = curNum + 1;
        
        if(role === 'student'){
            logger.debug('room student enter teacher-count：%d',this.state.teacherCount);
            if(this.state.teacherCount < 1){
                logger.debug('room student teacher count：%d',this.state.teacherCount);
                return false;
            } 
            this.state.studentCount?this.state.studentCount += 1 : this.state.studentCount = 1;
        }

        return true;
    };
    leave = (role)=>{
        logger.debug('leave room enter role:%s',role);
        this.state.num--;
        if(role === 'teacher') 
        {
            this.state.teacherCount -= 1;
            this.lesson = "default";
            logger.debug('leave room teacher count:%d',this.state.teacherCount);
        }
        if(role === 'student'){
            this.state.studentCount -= 1;
            logger.debug('leave room student count:%d',this.state.studentCount);
        }
    };
    clear = ()=>{
        this.state.num = 0;
        this.lesson = "default";
        this.state.teacherCount = 0;
        this.state.studentCount = 0;
    };

    getRtcManager = (prefix)=>{
        logger.debug('getRtcManager enter ',prefix)
        let rtc = this.rtcManager.get('teacher');
        if(prefix === 'student') rtc = this.rtcManager.get('student');
        logger.debug('getRtcManager | lesson %s',rtc.state.lesson);
        return rtc;
    };
    setRtcManager = (prefix,rtcManager)=>{
        if(prefix === 'teacher') this.rtcManager.set('teacher',rtcManager);
        if(prefix === 'student') this.rtcManager.set('student',rtcManager);
    };
    getBroadcastor = ()=>{
        return this.broadcaster;
    };
};

module.exports = {liveRoom};