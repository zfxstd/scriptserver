const EventsEmitter = require('events');
const { spawn } = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');

const defaultConfig = {
  core: {
    jar: 'minecraft_server.jar',
    args: ['-Xmx2G'],
    spawnOpts: {}
  },
};

class ScriptServer extends EventsEmitter {
  constructor(config = {}) {
    super();
    this.config = defaultsDeep({}, config, defaultConfig);

    process.on('exit',  this.stop);
    process.on('close', this.stop);

  }

  start() {
    if (this.spawn) throw new Error('Server already started');

    const args = this.config.core.args.concat('-jar', this.config.core.jar, 'nogui');
  
    this.spawn = spawn('java', args, this.config.core.spawnOpts);
    
    this.spawn.stdout.on('data', (d) => {  

      // Emit console
      d.toString().split('\n').forEach((l) => {
        if (l) this.emit('console', l);
      });
    
    });

    this.spawn.on("exit",data=>{
      this.emit("exit", data)
    })

    return this;
  }

  stop(force) {
    if (this.spawn) {
      if(force){
        this.spawn.kill();
        this.spawn = undefined;
      }else{
        this.send(new Buffer("stop\n"))
        const stopListener = () =>{
          this.spawn = undefined;
          this.removeListener("exit", stopListener)
        }
        this.on("exit", stopListener)
      }
    }else{
      console.log("server not runnung")
    }

    return this;
  }

  send(command){
    if(this.spawn){
      this.spawn.stdin.write(command)
    }else{
      console.log("server not running")
    }
  }
}

module.exports = ScriptServer;
