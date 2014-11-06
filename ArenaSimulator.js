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
	var timeSpeed = 1;
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
	 * @param   {int}  x  X coord
	 * @param   {int}  y  Y coord
	 *
	 * @return  {boolean}
	 */
	validCoords: function(x, y)
	{
		return x >= 0 && y >= 0 && x <= this.width && y <= this.height;
	},

	/**
	 * Method to repair X coord
	 *
	 * @param   {int}  x  Coord
	 *
	 * @return  {int}     Repaired coord
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
	 * @param   {int}  y  Coord
	 *
	 * @return  {int}     Repaired coord
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

	this.rotation = 0; // in radians
}

ArenaObject.prototype = {
	constructor: ArenaObject,

	/**
	 * Method to draw object to canvas
	 *
	 * @param   {object}  ctx  Canvas context
	 * @param   {int}     x    X coord
	 * @param   {int}     y    Y coord
	 *
	 * @return  {void}
	 */
	draw: function(ctx, x, y)
	{
		// recompute new object position
		this.recomputePosition();

		ctx.save();
		
		// set zero coords for rotation of canvas
		ctx.translate(x, y);
		ctx.rotate(this.rotation);

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
		if(!this.arena.validCoords(x, y))
		{
			x = this.arena.repairX(x);
			y = this.arena.repairY(y);
		}

		this.x = x;
		this.y = y;
	}
};

/**
 * Robot for arena
 */
function ArenaRobot()
{
	// inherit from arena object
	ArenaObject.call(this);
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

/**
 * Khepera robot
 */
function KheperaRobot()
{
	// inherit from arena object
	ArenaRobot.call(this);

	this.leftWheelSpeed  = 0; // speed in px/s
	this.rightWheelSpeed = 0; // speed in px/s
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