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
				var newX = object.x - (xs * distanceRatio) - 1; // add a little space betweet objects
				var newY = object.y - (ys * distanceRatio) - 1; // add a little space betweet objects

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
 */
function ArenaObject()
{
	this.x = 0;
	this.y = 0;

	this.radius = 20;

	// object edges - relative from object center
	this.leftEdge   = -this.radius;
	this.rightEdge  = this.radius;
	this.topEdge    = -this.radius;
	this.bottomEdge = this.radius;

	this.rotation = 0; // in radians
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

		ctx.fillStyle = '#666';

		// circle
		ctx.beginPath();
		ctx.arc(0, 0, this.radius, 0, Math.PI*2, true);
		ctx.fill();
		
		// front line
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(this.radius, 0);
		ctx.stroke();

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
	}
};

/**
 * Robot for arena
 */
function ArenaRobot()
{
	// inherit from arena object
	ArenaObject.call(this);

	// initialize sensors
	this.sensors = [];
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
	this.rotation += angle;
};

ArenaRobot.prototype.addSensor = function(sensor)
{
	if(!(sensor instanceof Sensor))
		throw new Error('You must pass valid sensor.');

	this.sensors.push(sensor);
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

	ArenaObject.prototype.draw.call(this, ctx, x, y, function(ctx)
	{
		// draw all sensors in robot
		self.drawSensors(ctx);
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

		sensor.draw(ctx, this.radius, 0);
	}
};

/**
 * Khepera robot
 */
function KheperaRobot()
{
	// inherit from arena object
	ArenaRobot.call(this);

	this.leftWheelSpeed  = 0; // speed in px/s
	this.rightWheelSpeed = 0; // speed in px/s

	// add sensors
	this.addSensor(new IrSensor({positionAngle: -50, viewAngle: 25}));
	this.addSensor(new IrSensor({positionAngle: -30, viewAngle: 25}));
	this.addSensor(new IrSensor({positionAngle: -10, viewAngle: 25}));
	this.addSensor(new IrSensor({positionAngle:  10, viewAngle: 25}));
	this.addSensor(new IrSensor({positionAngle:  30, viewAngle: 25}));
	this.addSensor(new IrSensor({positionAngle:  50, viewAngle: 25}));
	this.addSensor(new IrSensor({positionAngle:  150, viewAngle: 25}));
	this.addSensor(new IrSensor({positionAngle:  210, viewAngle: 25}));
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

}

Sensor.prototype = (function()
{
	// sensor data
	var data = [];

	return {
		constructor: Sensor,

		/**
		 * Method to get data form sensor
		 *
		 * @return  {array}
		 */
		getData: function()
		{
			return data;
		},

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
		}
	};
}());

/**
 * Infrared sensor
 */
function IrSensor(options)
{
	Sensor.call(this);

	options = options || {};

	// sensor parameters
	this.viewAngle      = options.viewAngle      || 15;   // in degrees
	this.detectionRange = options.detectionRange || 100; // in pixels

	this.color = options.color || '#ddf';

	// sensor position on robot
	this.positionAngle  = options.positionAngle  || 0; // sensor is on the edge of robot on this angle
}

IrSensor.prototype = Object.create(Sensor.prototype);

/**
 * Method to draw sensor to robot
 *
 * @param   {object}  ctx  Context for canvas
 * @param   {int}     x    X coord
 * @param   {int}     y    Y coord
 *
 * @return  {void}
 */
IrSensor.prototype.draw = function(ctx, x, y)
{
	ctx.save();

	ctx.fillStyle   = 'rgba(0, 0, 0, 0.05)';
	ctx.strokeStyle = this.color;

	// view angle half
	var viewAngleHalf = (this.viewAngle / 2) * Math.PI / 180; // in radians

	ctx.rotate(this.positionAngle * Math.PI / 180);

	// circle
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.arc(x, y, this.detectionRange, viewAngleHalf, -viewAngleHalf, true);
	ctx.lineTo(x, y);
	ctx.fill();
	ctx.stroke();

	ctx.restore();
};