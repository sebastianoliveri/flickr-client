
module.exports = Page;

function Page(aPageNumber, aPageSize, theContent) {
    this.pageNumber = aPageNumber;
    this.pageSize = aPageSize;
    this.content = theContent;
}

Page.prototype.hasPrevious = function() {
    return this.pageNumber > 0;
}

Page.prototype.hasNext = function() {
    return this.content.length < this.pageSize;
}
