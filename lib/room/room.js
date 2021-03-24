'use strict';
const fs = require("fs");
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
    };

    init = async (callback)=>{
        const id = this.state.id;
        const file = 'index_' + id + '.html';
        const dir = "C:/source/projects/webTeach/view/"; 
        fs.copyFile("C:/source/projects/webTeach/view/index.html", dir + file,(err)=>{
            if(err){
                logger.error('initRoom happens error %s' ,JSON.stringify(err));
                callback(err);
            }
            else{
                fs.appendFile(dir+file, `<script>window.roomid =${id} </script>`, er => {
                    if (!er) {
                        callback();
                    }
                    callback(er);
                });
            }
        });
    };
    enter = async (role)=>{
        if(role === 'teacher') 
        {
            if(this.state.teacherCount === 1)return false;
            this.state.teacherCount = 1;
        }
        
        const curNum = this.state.num || 0;
        const maxNum = this.state.max || 10; 
        if(curNum > maxNum) return false;
        this.state.num = curNum + 1;
        
        if(role === 'student'){
            if(this.state.teacherCount < 1) return false;
            this.state.studentCount?this.state.studentCount += 1 : this.state.studentCount = 1;
        }

        return true;
    };
    leave = (role)=>{
        this.state.num--;
        if(role === 'teacher') 
        {
            this.state.teacherCount -= 1;
        }
        if(role === 'student'){
            this.state.studentCount -= 1;
        }
    };
    clear = ()=>{
        this.state.num = 0;
        this.lesson = "default";
    };

    getRtcManager = (prefix)=>{
        let rtc = this.rtcManager.get('teacher');
        if(prefix === 'student') this.rtcManager.get('student');
        logger.debug('getRtcManager | lesson %s',rtc.state.lesson);
        return rtc;
    };
    setRtcManager = (prefix,rtcManager)=>{
        if(prefix === 'teacher') this.rtcManager.set('teacher',rtcManager);
        if(prefix === 'student') this.rtcManager.set('teacher',rtcManager);
    };
};

module.exports = {liveRoom};