/*
 * Javascript Quadtree
 * @licence MIT
 * @author David Figatner
 * Copyright (c) 2016 YOPEY YOPEY LLC (https://github.com/davidfig/quadtree-js/)
 */
class QuadTree
{
     /*
      * @param {object} bounds of the node, object with x, y, width, height
      * @param {number=10} maxObjects a node can hold before splitting into 4 subnodes
      * @param {number=4} maxLevels - total max levels inside root Quadtree
      * @param {number=0} level - depth level, required for subnodes
      */
    constructor(maxBounds, maxObjects, maxLevels, level)
    {
        this.maxObjects = maxObjects || 10;
        this.maxLevels = maxLevels || 8;

        this.level = level || 0;
        this.bounds = maxBounds;

        this.objects = [];
        this.nodes = [];
    }

    /*
     * Split the node into 4 subnodes
     */
    split()
    {
        var nextLevel = this.level + 1;
        var subWidth = Math.round(this.bounds.width / 2);
        var subHeight = Math.round(this.bounds.height / 2);
        var x = Math.round(this.bounds.x);
        var y = Math.round(this.bounds.y);

        // top right
        this.nodes[0] = new QuadTree({
            x: x + subWidth,
            y: y,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, nextLevel);

        // top left
        this.nodes[1] = new QuadTree({
            x: x,
            y: y,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, nextLevel);

        // bottom left
        this.nodes[2] = new QuadTree({
            x: x,
            y: y + subHeight,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, nextLevel);

        // bottom right
        this.nodes[3] = new QuadTree({
            x: x + subWidth,
            y: y + subHeight,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, nextLevel);
    };

    /*
     * Determine which node the object belongs to
     * @param {object} rect of the area to be checked, with x, y, width, height
     * @return {number} index of the subnode (0-3), or -1 if rect cannot completely fit within a subnode and is part of the parent node
     */
    getIndex(rect)
    {
        var index = -1;
        var verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
        var horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

        // rect can completely fit within the top quadrants
        var topQuadrant = (rect.y < horizontalMidpoint && rect.y + rect.height < horizontalMidpoint);

        // rect can completely fit within the bottom quadrants
        var bottomQuadrant = (rect.y > horizontalMidpoint);

        // rect can completely fit within the left quadrants
        if (rect.x < verticalMidpoint && rect.x + rect.width < verticalMidpoint)
        {
            if (topQuadrant)
            {
                index = 1;
            }
            else if (bottomQuadrant)
            {
                index = 2;
            }
        }

        //rect can completely fit within the right quadrants
        else if (rect.x > verticalMidpoint)
        {
            if (topQuadrant)
            {
                index = 0;
            }
            else if (bottomQuadrant)
            {
                index = 3;
            }
        }
        return index;
    };

    /*
     * Insert the object into the node. If the node
     * exceeds the capacity, it will split and add all
     * objects to their corresponding subnodes.
     * @param {object} rect of the object to be added, with x, y, width, height
     */
    insert(rect)
    {
        var i = 0, index;

        // if we have subnodes ...
        if (typeof this.nodes[0] !== 'undefined')
        {
            index = this.getIndex(rect);
            if (index !== -1)
            {
                this.nodes[index].insert(rect);
                return;
            }
        }
        this.objects.push(rect);
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels)
        {

            // split if we don't already have subnodes
            if (typeof this.nodes[0] === 'undefined')
            {
                this.split();
            }

            // add all objects to there corresponding subnodes
            while (i < this.objects.length)
            {
                index = this.getIndex(this.objects[i]);
                if (index !== -1)
                {
                    this.nodes[index].insert(this.objects.splice(i, 1)[0]);
                }
                else
                {
                    i = i + 1;
                }
            }
        }
    }

    /*
     * Return all objects that could collide with the given object
     * @param {objec} rect of the object to be checked, with x, y, width, height
     * @Return {array} all detected objects
     */
    retrieve(rect)
    {
        var index = this.getIndex(rect);
        var returnObjects = this.objects;

        // if we have subnodes ...
        if (typeof this.nodes[0] !== 'undefined')
        {
            // if rect fits into a subnode ..
            if (index !== -1)
            {
                returnObjects = returnObjects.concat(this.nodes[index].retrieve(rect));
            }

            // if rect does not fit into a subnode, check it against all subnodes
            else
            {
                for (var i = 0; i < this.nodes.length; i = i + 1)
                {
                    returnObjects = returnObjects.concat(this.nodes[i].retrieve(rect));
                }
            }
        }

        return returnObjects;
    }

    /*
     * perform a callback on all objects that could collide with the given object
     * @param {object} rect of the object to be checked, with x, y, width, height
     * @param {function} callback
     * @return {boolean} true if callback returned true (and terminated)
     */
    callback(rect, callback)
    {
        var index = this.getIndex(rect);
        for (var i = 0; i < this.objects.length; i++)
        {
            if (callback(this.objects[i]))
            {
                return true;
            }
        }
        if (this.nodes.length)
        {
            if (index !== -1)
            {
                if (this.nodes[index].callback(rect, callback))
                {
                    return true;
                }
            }
            else
            {
                for (var i = 0; i < this.nodes.length; i++)
                {
                    if (this.nodes[i].callback(rect, callback))
                    {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    callbackAll(callback)
    {
        for (var i = 0; i < this.objects.length; i++)
        {
            callback(this.objects[i]);
        }
        for (var i = 0; i < this.nodes.length; i++)
        {
            this.node[i].callbackAll(callback);
        }
    }

    /*
     * Clear the quadtree
     */
    clear()
    {
        this.objects = [];

        for (var i = 0; i < this.nodes.length; i = i + 1)
        {
            if (typeof this.nodes[i] !== 'undefined')
            {
                this.nodes[i].clear();
            }
        }
        this.nodes = [];
    };
}

module.exports = QuadTree;