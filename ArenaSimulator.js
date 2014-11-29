/**
 * Copyright 2014 Martin Vyšňovský (martinvysnovsky@gmail.com)
 */

'use strict';

/**
 * Simple arena simulator for virtual objects
 *
 * @param  {object}  canvas  Canvas html element node
 */
function ArenaSimulator(canvas)
{
	if(!canvas)
		throw new Error('You must pass canvas as parameter.');

	this.canvas = canvas;
	this.ctx    = canvas.getContext('2d');

	// canvas size
	this.width  = canvas.width;
	this.height = canvas.height;

	// array of objects in arena
	this.objects = [];

	// virtual time speed
	this.timeSpeed = 1;
}

ArenaSimulator.prototype = {
	constructor: ArenaSimulator,
	
	/**
	 * Method to insert object to arena to some position
	 *
	 * @param  {object}  object  Object to insert
	 * @param  {int}     x       X coord
	 * @param  {int}     y       Y coord
	 */
	addObject: function(object, x, y)
	{
		if(!(object instanceof ArenaObject))
			throw new Error('Parameter must be instance of ArenaObject.');

		// keep refrence to arena
		object.arena = this;

		x = x || 0;
		y = y || 0;

		object.setCoords(x, y);

		this.objects.push(object);
		this.objectsLength = this.objects.length;
	},

	/**
	 * Method to check if coords is valid
	 *
	 * @param   {float}  x  X coord
	 * @param   {float}  y  Y coord
	 *
	 * @return  {boolean}
	 */
	validCoords: function(x, y)
	{
		return this.validX(x) && this.validY(y);
	},

	/**
	 * Method to check if X coord is valid
	 *
	 * @param   {float}  x  X coord
	 *
	 * @return  {boolean}
	 */
	validX: function(x)
	{
		return x >= 0 && x <= this.width;
	},

	/**
	 * Method to check if Y coord is valid
	 *
	 * @param   {float}  x  Y coord
	 *
	 * @return  {boolean}
	 */
	validY: function(y)
	{
		return y >= 0 && y <= this.height;
	},

	/**
	 * Method to repair X coord
	 *
	 * @param   {float}  x  Coord
	 *
	 * @return  {float}     Repaired coord
	 */
	repairX: function(x)
	{
		if(x < 0)
			return 0;
		else if(x > this.width)
			return this.width;
		else
			return x;
	},

	/**
	 * Method to repair Y coord
	 *
	 * @param   {float}  y  Coord
	 *
	 * @return  {float}     Repaired coord
	 */
	repairY: function(y)
	{
		if(y < 0)
			return 0;
		else if(y > this.height)
			return this.height;
		else
			return y;
	},

	/**
	 * Method to reapair all objects that are collide with given object
	 *
	 * @param   {object}  object  Object to check
	 *
	 * @return  {array}           Return array of colliding objects
	 */
	repairCollidingObjects: function(objectToCheck)
	{
		var collide = [];

		for(var i=0; i<this.objectsLength; i++)
		{
			var object = this.objects[i];

			if(object == objectToCheck)
				continue;

			var xs = object.x - objectToCheck.x;
			var ys = object.y - objectToCheck.y;

			var distance    = Math.round(Math.sqrt((xs * xs) + (ys * ys)));
			var minDistance = object.radius + objectToCheck.radius;

			if(distance < minDistance)
			{
				var distanceRatio = minDistance / distance;
				
				// repair coords
				var newX = object.x - (xs * distanceRatio * 1.01); // add a little space betweet objects
				var newY = object.y - (ys * distanceRatio * 1.01); // add a little space betweet objects

				// TODO: repair coords near walls

				objectToCheck.x = newX;
				objectToCheck.y = newY;

				collide.push(object);
			}
		}

		return collide;
	},

	/**
	 * Method to draw arena and all object in it
	 *
	 * @return  {void}
	 */
	draw: function()
	{
		// clear canvas
		this.clear();

		var ctx = this.ctx;

		// draw every object in arena
		for(var i=0; i<this.objectsLength; i++)
		{
			var object = this.objects[i];

			object.draw(ctx, object.x, object.y);
		}
	},

	/**
	 * Method to clear arena
	 *
	 * @return  {void}
	 */
	clear: function()
	{
		this.ctx.clearRect(0, 0, this.width, this.height);
	}
};

/**
 * Object for arena
 *
 * @param  {object}  options  Options for arena object
 */
function ArenaObject(options)
{
	options = options || {};

	this.x = 0;
	this.y = 0;

	this.radius = options.radius || 20;

	// object edges - relative from object center
	this.leftEdge   = -this.radius;
	this.rightEdge  = this.radius;
	this.topEdge    = -this.radius;
	this.bottomEdge = this.radius;

	this.rotation = 0; // in radians

	this.color = options.color || '#666';
}

ArenaObject.prototype = {
	constructor: ArenaObject,

	/**
	 * Method to draw object to canvas
	 *
	 * @param   {object}    ctx         Canvas context
	 * @param   {int}       x           X coord
	 * @param   {int}       y           Y coord
	 * @param   {function}  beforeDraw  Method to run before draw object
	 * @param   {function}  afterDraw   Method to run after draw object
	 *
	 * @return  {void}
	 */
	draw: function(ctx, x, y, beforeDraw, afterDraw)
	{
		// recompute new object position
		this.recomputePosition();

		ctx.save();
		
		// set zero coords for rotation of canvas
		ctx.translate(x, y);
		ctx.rotate(this.rotation);

		if(typeof beforeDraw == 'function')
			beforeDraw(ctx);

		ctx.fillStyle = this.color;

		// circle
		ctx.beginPath();
		ctx.arc(0, 0, this.radius, 0, Math.PI*2, true);
		ctx.fill();

		if(typeof afterDraw == 'function')
			afterDraw(ctx);

		ctx.restore();
	},

	/**
	 * Method to change position of object in time
	 *
	 * @return  {void}
	 */
	recomputePosition: function()
	{
		// keep previous position
	},

	/**
	 * Method to set object coords
	 *
	 * @param  {int}  x  X coord
	 * @param  {int}  y  Y coord
	 */
	setCoords: function(x, y)
	{
		var arena = this.arena;

		// check if coords is inside arena and avoid to crash to wall
		var leftEdgeX = x + this.leftEdge;

		if(!arena.validX(leftEdgeX)) // left edge
			x = arena.repairX(leftEdgeX) - this.leftEdge;
		else // right edge
		{
			var rightEdgeX = x + this.rightEdge;

			if(!arena.validX(rightEdgeX)) // left edge
				x = arena.repairX(rightEdgeX) - this.rightEdge;
		}

		var topEdgeY = y + this.topEdge;

		if(!arena.validY(topEdgeY)) // top edge
			y = arena.repairY(topEdgeY) - this.topEdge;
		else // bottom edge
		{
			var bottomEdgeY = y + this.bottomEdge;

			if(!arena.validY(bottomEdgeY)) // left edge
				y = arena.repairY(bottomEdgeY) - this.bottomEdge;
		}

		// check for collision with another objects and repair its
		var collide = arena.repairCollidingObjects(this);

		if(collide.length === 0)
		{
			this.x = x;
			this.y = y;
		}
		else if(typeof this.onColision == 'function')
			this.onColision();
	}
};

/**
 * Obstacle for arena
 *
 * @param  {object}  options  Options foro obstacle object
 */
function Obstacle(options)
{
	// inherit from arena object
	ArenaObject.call(this, options);
}

Obstacle.prototype = Object.create(ArenaObject.prototype);

/**
 * Robot for arena
 */
function ArenaRobot(options)
{
	options = options || {};

	// inherit from arena object
	ArenaObject.call(this, options);

	// initialize sensors
	this.sensors = [];

	this.onColision = options.onColision || null; // function to run on colision
}

ArenaRobot.prototype = Object.create(ArenaObject.prototype);

/**
 * Method to rotate robot
 *
 * @param   {float}  angle  Relative angle in radiant to rotate
 *
 * @return  {void}
 */
ArenaRobot.prototype.rotate = function(angle)
{
	var PiTwo = 2 * Math.PI;

	var newAngle = this.rotation + angle;

	if(newAngle < 0)
		newAngle += PiTwo;

	if(newAngle > PiTwo)
		newAngle -= PiTwo;

	this.rotation =  newAngle; // in radians
};

/**
 * Method to add sensor to robot on some location
 *
 * @param  {object}  sensor  Sensor to add
 * @param  {float}  x        X coord on robot
 * @param  {float}  y        Y coord on robot
 */
ArenaRobot.prototype.addSensor = function(sensor, x, y)
{
	if(!(sensor instanceof Sensor))
		throw new Error('You must pass valid sensor.');

	// back refrence to robot
	sensor.robot = this;

	// set coords
	sensor.onRobotX = x || 0;
	sensor.onRobotY = y || 0;

	this.sensors.push(sensor);
};

/**
 * Method to get all sensors data
 *
 * @return  {array}
 */
ArenaRobot.prototype.getDataFromSensors = function()
{
	var data = [];

	for(var i=0, len=this.sensors.length; i<len; i++)
		data.push(this.sensors[i].getData());

	return data;
};

/**
 * Method to draw object to canvas
 *
 * @param   {object}  ctx  Canvas context
 * @param   {int}     x    X coord
 * @param   {int}     y    Y coord
 *
 * @return  {void}
 */
ArenaRobot.prototype.draw = function(ctx, x, y)
{
	var self = this;

	ArenaObject.prototype.draw.call(this, ctx, x, y,
	function(ctx)
	{
		// draw all sensors in robot
		self.drawSensors(ctx);
	},
	function(ctx)
	{
		ctx.save();

		// front line
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(self.radius, 0);
		ctx.stroke();

		ctx.restore();
	});
};

/**
 * Method to draw robot sensors
 *
 * @param   {object}  ctx  Context of canvas
 * 
 * @return  {void}
 */
ArenaRobot.prototype.drawSensors = function(ctx)
{
	for(var i=0, len=this.sensors.length; i<len; i++)
	{
		var sensor = this.sensors[i];

		sensor.draw(ctx);
	}
};

/**
 * Khepera robot
 */
function KheperaRobot(options)
{
	options = options || {};

	// inherit from arena object
	ArenaRobot.call(this, options);

	this.leftWheelSpeed  = 0; // speed in px/s
	this.rightWheelSpeed = 0; // speed in px/s

	// add sensors
	this.addSensor(new IrSensor({positionAngle: -50, viewAngle: 25}), this.radius);
	this.addSensor(new IrSensor({positionAngle: -30, viewAngle: 25}), this.radius);
	this.addSensor(new IrSensor({positionAngle: -10, viewAngle: 25}), this.radius);
	this.addSensor(new IrSensor({positionAngle:  10, viewAngle: 25}), this.radius);
	this.addSensor(new IrSensor({positionAngle:  30, viewAngle: 25}), this.radius);
	this.addSensor(new IrSensor({positionAngle:  50, viewAngle: 25}), this.radius);
	this.addSensor(new IrSensor({positionAngle:  150, viewAngle: 25}), this.radius);
	this.addSensor(new IrSensor({positionAngle:  210, viewAngle: 25}), this.radius);
}

KheperaRobot.prototype = Object.create(ArenaRobot.prototype);

/**
 * Method to change position of object in time
 *
 * @return  {void}
 */
KheperaRobot.prototype.recomputePosition = function()
{
	var x = this.x;
	var y = this.y;

	var t = (1 / 60) * this.arena.timeSpeed; // time; 60 frames per second

	var sL = this.leftWheelSpeed  * t; // path length for left wheel
	var sR = this.rightWheelSpeed * t; // path length for right wheel

	// rotate robot
	this.rotate((sL - sR) / (2 * this.radius));

	var sM = (sL + sR) / 2; // mean path length

	x = (sM * Math.cos(this.rotation)) + x;
	y = (sM * Math.sin(this.rotation)) + y;

	this.setCoords(x, y);
};

/**
 * Sensors for robot
 */
function Sensor()
{
	this.onRobotX = 0; // X coord on robot from center
	this.onRobotY = 0; // Y coord on robot from center

	this.detects = []; // array of objects to detect
}

Sensor.prototype = (function()
{
	return {
		constructor: Sensor,

		/**
		 * Method to draw sensor to robot
		 *
		 * @param   {object}  ctx  Context for canvas
		 *
		 * @return  {void}
		 */
		draw: function(ctx)
		{
			// nothing to draw
		},

		/**
		 * Method to get sensor absolute angle in arena
		 *
		 * @return  {float}
		 */
		getAbsoluteAngle: function()
		{
			var PiTwo = Math.PI * 2;

			// absolute angle of sensor
			var angle = this.robot.rotation + this.positionAngle;

			if(angle < 0)
				angle += PiTwo;

			if(angle > PiTwo)
				angle -= PiTwo;

			return angle;
		},

		/**
		 * Method to get sensor coords in map
		 *
		 * @return  {object}
		 */
		getCoords: function()
		{
			var robot = this.robot;

			// coords of robot
			var x = robot.x;
			var y = robot.y;

			var angle = this.getAbsoluteAngle();

			// compute coords of sensor
			x += (Math.cos(angle) * robot.radius);
			y += (Math.sin(angle) * robot.radius);

			return {
				x: x,
				y: y
			};
		}
	};
}());

/**
 * Infrared sensor
 *
 * @param  {object}  options  Options for sensor object
 */
function IrSensor(options)
{
	Sensor.call(this);

	options = options || {};

	// sensor parameters
	this.viewAngle      = options.viewAngle      || 15;   // in degrees
	this.detectionRange = options.detectionRange || 50; // in pixels

	this.color = options.color || '#ddf';

	// sensor position on robot
	this.positionAngle  = (options.positionAngle && (options.positionAngle * Math.PI / 180))  || 0; // sensor is on the edge of robot on this angle; in radians

	this.detects = options.detects || ['wall', 'object'];  // array of objects to detect
}

IrSensor.prototype = Object.create(Sensor.prototype);

/**
 * Method to get data from sensor
 *
 * @return  {mixed}
 */
IrSensor.prototype.getData = function()
{
	// detect some wall
	if(this.detects.indexOf('wall') !== -1 && this.detectWalls())
		return 1;

	// detect objects
	if(this.detects.indexOf('object') !== -1 && this.detectObjects())
		return 1;

	return 0;
};

/**
 * MEthod to detect walls
 *
 * @return  {boolean}
 */
IrSensor.prototype.detectWalls = function()
{
	var PiHalf        = Math.PI / 2;
	var PiTwo         = Math.PI * 2;
	var viewAngleHalf = (this.viewAngle / 2) * Math.PI / 180; // in radians

	// absolute angle of sensor
	var sensorAbsoluteAngle = this.getAbsoluteAngle();

	// compute coords of sensor
	var coords = this.getCoords();
	var x = coords.x;
	var y = coords.y;

	// find refrence angle - angle from X axis
	var sensorRefrenceAngle;
	var quartal;
	if(sensorAbsoluteAngle < PiHalf) // 1. quadrant
	{
		sensorRefrenceAngle = sensorAbsoluteAngle;
		quartal = 1;
	}
	else if(sensorAbsoluteAngle < Math.PI) // 2. quadrant
	{
		sensorRefrenceAngle = Math.PI - sensorAbsoluteAngle;
		quartal = 2;
	}
	else if(sensorAbsoluteAngle < (Math.PI + PiHalf)) // 3. quadrant
	{
		sensorRefrenceAngle = sensorAbsoluteAngle - Math.PI;
		quartal = 3;
	}
	else // 4. quadrant
	{
		sensorRefrenceAngle = PiTwo - sensorAbsoluteAngle;
		quartal = 4;
	}

	// top/bottom
	var relativeDetectionRangeY = Math.cos(PiHalf - Math.min(PiHalf, (sensorRefrenceAngle + viewAngleHalf))) * this.detectionRange;
	var wallDistanceTop         = y;
	var wallDistanceBottom      = this.robot.arena.height - y;

	if(((quartal == 1 || quartal == 2) && relativeDetectionRangeY > wallDistanceBottom) || ((quartal == 3 || quartal == 4) && relativeDetectionRangeY > wallDistanceTop))
		return true;
	
	var relativeDetectionRangeX = Math.cos(Math.max(0, (sensorRefrenceAngle - viewAngleHalf))) * this.detectionRange;
	var wallDistanceRight       = this.robot.arena.width - x;
	var wallDistanceLeft        = x;

	// left/right
	if(((quartal == 1 || quartal == 4) && relativeDetectionRangeX > wallDistanceRight) || ((quartal == 2 || quartal == 3) && relativeDetectionRangeX > wallDistanceLeft))
		return true;

	return false;
};

/**
 * Method to detect objects
 *
 * @return  {boolean}
 */
IrSensor.prototype.detectObjects = function()
{
	var robot = this.robot;
	var arena = robot.arena;

	// absolute angle of sensor
	var sensorAbsoluteAngle = this.getAbsoluteAngle();

	// compute coords of sensor
	var coords = this.getCoords();
	var x = coords.x;
	var y = coords.y;

	var objects = arena.objects;
	
	for(var i=0; i<arena.objectsLength; i++)
	{
		var object = objects[i];

		// not self
		if(object == robot)
			continue;

		var diffX = Math.abs(object.x - x);

		if((diffX - object.radius) > this.detectionRange)
			continue;

		var diffY = Math.abs(object.y - y);

		if((diffY - object.radius) > this.detectionRange)
			continue;

		var sensorObjectDist = Math.sqrt((diffX * diffX) + (diffY * diffY));

		if((sensorObjectDist - object.radius) > this.detectionRange)
			continue;

		var coordsAngle;
		if(object.x >= x && object.y >= y) // 1. quartal
			coordsAngle = Math.atan(diffY / diffX);
		else if(object.x < x && object.y >= y) // 2. quartal
			coordsAngle = Math.PI - Math.atan(diffY / diffX);
		else if(object.x < x && object.y < y) // 3. quartal
			coordsAngle = Math.PI + Math.atan(diffY / diffX);
		else // 4. quartal
			coordsAngle = 2 * Math.PI - Math.atan(diffY / diffX);

		var sensorObjectAngle = Math.abs(sensorAbsoluteAngle - coordsAngle);

		if(sensorObjectAngle > Math.PI)
			sensorObjectAngle = (2 * Math.PI) - sensorObjectAngle;

		var objectEdgeAngle = Math.asin(object.radius / sensorObjectDist);
		var viewAngleHalf   = (this.viewAngle / 2) * Math.PI / 180; // in radians

		if(sensorObjectAngle <= (viewAngleHalf + objectEdgeAngle))
		{
			var cos = Math.cos(sensorObjectAngle - viewAngleHalf);
			
			if((cos * sensorObjectDist) < this.detectionRange)
				return true;

			var t = cos * this.detectionRange;

			if(Math.sqrt(Math.pow(sensorObjectDist - t, 2) + Math.pow(this.detectionRange, 2) - Math.pow(t, 2)) < object.radius)
				return true;
		}
	}

	return false;
};

/**
 * Method to draw sensor to robot
 *
 * @param   {object}  ctx  Context for canvas
 *
 * @return  {void}
 */
IrSensor.prototype.draw = function(ctx)
{
	var sensorValue = this.getData();

	ctx.save();

	ctx.fillStyle   = (sensorValue == 1) ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.05)';
	ctx.strokeStyle = this.color;

	// view angle half
	var viewAngleHalf = (this.viewAngle / 2) * Math.PI / 180; // in radians

	ctx.rotate(this.positionAngle);

	// circle
	ctx.beginPath();
	ctx.moveTo(this.onRobotX, 0);
	ctx.arc(this.onRobotX, 0, this.detectionRange, viewAngleHalf, -viewAngleHalf, true);
	ctx.lineTo(this.onRobotX, 0);
	ctx.fill();
	ctx.stroke();

	ctx.restore();
};