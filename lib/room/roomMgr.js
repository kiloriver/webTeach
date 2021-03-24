'use strict';
const room_config = require('../../config/room.json');
const {liveRoom} = require('./room');
const logger = require('../logger').logger('webTeach-roomMgr');
class roomManger {
    constructor(options = {}) {             
        this.rooms = [];
        this.roomList = [];
    };

    load = () => {      
        this.rooms = room_config;
        // this.roomList = new Map();
        const self = this;
        this.rooms.forEach((room)=>{
            const roomObj = new liveRoom(room);
            roomObj.init((err)=>{
                if(!err){
                    this.roomList.push(roomObj);
                    logger.debug('load rooms | id:%d -- List:%j',room.id,this.roomList);
                }else{
                    logger.error('load rooms | id:%d -- err:%s',room.id,JSON.stringify(err));
                }
            });
        });
    };

    dispatch = (lesson)=>{
        for(let i = 0; i < this.roomList.length; i++){
            const r = this.roomList[i];
            if(r && r.lesson !== undefined && r.lesson === lesson)return r;
        }
        for(let i = 0; i < this.roomList.length; i++){
            let r = this.roomList[i];
            if(r && r.lesson === "default" ){
                r.lesson = lesson;
                return r;
            }
        }
        return null;
    };
    join = (id,role)=>{
        const roomid = id;
        const room = this.find(roomid);
        if(room === undefined || room === null){
            logger.error("room(%s) is invalidate",roomid);        
            return false;
        }
        if(room.enter(role) === false){
            logger.error("room(%s) is full",roomid);
            return false;
        }

        return true;
    };
    exit = (id,role)=>{
        const roomid = id;
        const room = this.find(roomid);
        room.leave(role);
    };
    find = (id)=>{
        for(let i = 0; i < this.roomList.length; i++){
            const r = this.roomList[i];
            if(r && parseInt(r.state.id || -1)  === parseInt(id))
                return r;
        }

        return null;
    };
    getRtcManager = (prefix,roomid)=>{
       return this.find(roomid).getRtcManager(prefix);
    }
}

module.exports = roomManger;