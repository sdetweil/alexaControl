function _Dilbert($scope, $http, $q, AutoSleepService, Focus,$translate) {

var FauxMo = require('node-fauxmo');
var pm2 = require('pm2');
const exec = require("child_process").exec;

			var d = FauxMo.devices
			var port = config.alexaControl.startPort
	        var cD = customDevices(config.alexaControl); 
	       // var nD = notificationDevices(cD, {});
	        //var pD = pageDevices(nD);
	        var mD = menuDevices(cD);

	        fauxMoPages = new FauxMo(mD);       // creates fauxmo devices
	        console.log(" there are "+fauxMoPages.length+" active")

			function formattedName (devname,actionString){
		        var result=actionString
		        if(devname != undefined){
		            var s = actionString.split(' ')
		            if(s.length>1)
		                s.splice(1,0,devname)
		            else
		                s.unshift(devname)
		            result = s.join(' ')
		        }        
		        return result;
		    }
		    
		     function customDevices(customD){      //  creates your custom devices from config		     	
		        for(i = 0; i < Object.keys(customD.devices).length; i++){
		            if(customD.devices[i].port === undefined){
		                customD.devices[i].port = port + 30 + i;
		            }
		            customD.devices[i].handler = new Function('action', customD.devices[i].handler)
		            customD.devices[i].context={Focus:Focus,AutoSleepService:AutoSleepService}
		        }
		        return customD;
		    }

		    function menuDevices (menuD){       //  create your devices to control the Mirror and pi
		        var opts = { timeout: 8000 };
		        console.log("menu device ")
		        counter = 0 // + Object.keys(menuD.devices).length

		        if(config.alexaControl.refresh | true ){
		            device = {}
		            device.name = formattedName(config.alexaControl.deviceName,$translate.instant("alexaControl.REFRESH"))
		            device.port = port
		            device.handler = function(action) {sendSocketNotification("ACTION", "refresh")}

		            menuD.devices.push(device);
		            counter++;
		            port++
		        }


		        if(config.alexaControl.restart | true ){        // only with PM2
		            device = {}
		            device.name = formattedName(config.alexaControl.deviceName,$translate.instant("alexaControl.RESTART"))
		            device.port = port
		            device.handler = function(action) {
		                pm2.connect((err) => {
		                    if (err) {
		                        console.error(err);
		                    }
		        
		                    console.log("Restarting PM2 process: " + config.alexaControl.pm2ProcessName);
		                    pm2.restart(config.alexaControl.pm2ProcessName, function(err, apps) {
		                        pm2.disconnect();
		                        if (err) { console.log(err); }
		                    });
		                });
		            }
		            
		            menuD.devices.push(device);
		            counter++;
		        	port++
		        }

		        
		        if(config.alexaControl.stop | true ){        // only with PM2
		            device = {}
		            device.name = formattedName(config.alexaControl.deviceName,$translate.instant("alexaControl.STOP"))
		            device.port = port
		            device.handler = function(action) {
		                pm2.connect((err) => {
		                    if (err) {
		                        console.error(err);
		                    }
		        
		                    console.log("Stopping PM2 process: " + config.alexaControl.pm2ProcessName);
		                    pm2.stop(config.alexaControl.pm2ProcessName, function(err, apps) {
		                        pm2.disconnect();
		                        if (err) { console.log(err); }
		                    });
		                });
		            }

		            menuD.devices.push(device);
		            counter++;
		            port++;
		        }
		        
		        
		        if(config.alexaControl.reboot | true ){        //reboot the pi
		            device = {}
		            device.name = formattedName(config.alexaControl.deviceName,$translate.instant("alexaControl.REBOOT"))
		            device.port =port
		            device.handler = function(action) {
		                exec("sudo shutdown -r now", opts, (error, stdout, stderr) => {
		                     checkForExecError(error, stdout, stderr); 
		                    });
		                }
		            menuD.devices.push(device);
		            counter++;
		            port++
		        }		        
		        
		        if(config.alexaControl.shutdown | true ){        // shutdwon the pi
		            device = {}
		            device.name = formattedName(config.alexaControl.deviceName,$translate.instant("alexaControl.SHUTDOWN"))
		            device.port = port
		            device.handler = function(action) {
		                exec("sudo shutdown -h now", opts, (error, stdout, stderr) => {
		                    checkForExecError(error, stdout, stderr); 
		                });
		            }           
		            menuD.devices.push(device);
		            counter++;
		            port++
		        }

		        /**
		         * for me worked only vcgencmd display_power 0 and vcgencmd display_power 1
		         * probably for you work tvservice --off and tvservice --preferred
		         * test it in terminal if you aren't sure
		         */
		        
		        if(config.alexaControl.monitorToggle | true ){ 
		        	console.log("monitorToggle requested")
		            device = {}
		            device.name = formattedName(config.alexaControl.deviceName,$translate.instant("alexaControl.MONITOR"))
		            device.port = port
		            if(config.alexaControl.blankingStyle =='vgencmd'){
		                device.handler = function(action) {     
		                    if(action === 1){
		                        exec("vcgencmd display_power 1", opts, (error, stdout, stderr) => {
		                            checkForExecError(error, stdout, stderr); 
		                        });
		                    }if(action === 0){
		                        exec("vcgencmd display_power 0", opts, (error, stdout, stderr) => {
		                            checkForExecError(error, stdout, stderr); 
		                        });
		                    }
		                }
		            }else if(config.alexaControl.blankingStyle =='tvservice'){
		                device.handler = function(action) {     
		                    if(action === 1){
		                        exec("tvservice --preferred", opts, (error, stdout, stderr) => {
		                            checkForExecError(error, stdout, stderr);
		                        });
		                    }if(action === 0){
		                        exec("tvservice --off", opts, (error, stdout, stderr) => {
		                            checkForExecError(error, stdout, stderr);
		                        });
		                    }
		                }
		            }
		            else if(config.alexaControl.blankingStyle =='hiding'){
		            	console.log("configuring toggle with hiding")
		            	device.handler = function(action) {     
		            		console.log("received monitor toggle with hide action="+action)
		            		if(action==0)
		            		  AutoSleepService.sleep()
		            		else
		            		  AutoSleepService.wake()
		          		}	
		            }
		            menuD.devices.push(device);
		            counter++;
		            port++
		        }
		        return menuD; 
		    }    

}

angular.module('SmartMirror')
	.controller('alexaControl', _Dilbert);