describe('Manifest', function () {
  var $input;

  beforeEach(function () {
    setFixtures('<form action="/manifest" method="get"><input type="text" name="input" id="input"></form>');
    $input = $('#input');
    $input.manifest();
  });

  describe('create', function () {
    it('should add the class "mf_input"', function () {
      expect($input).toHaveClass('mf_input');
    });
  });
});
