# Play boggle on www
import boggle
import cgi
import datetime
import jinja2
import json
import os
import pprint
import string
import sys
import urllib
import webapp2

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))

dictionary = boggle.Dictionary(u'./words')
game = boggle.Game(dictionary)

def cross_out(answers, user_words):
    # Return dictionary of user_words. Value 0 if the
    # word is too short or is not an answer
    words = {}
    for u in user_words:
        u = string.lower(u)
        if u in answers and len(u) > 3:
            words[u] = 1
        else:
            words[u] = 0
    return words

word_anchor_base = u'http://wiktionary.org/wiki/'
def word_anchor_filter(word, delete=False):
    # Show solution words as link to web dictionary for lookup
    if delete:
        return u'<a href="' + word_anchor_base + word + u'"><del>' + word + '</del></a>'
    else:
        return u'<a href="' + word_anchor_base + word + u'">' + word + '</a>'

jinja_environment.filters['word_anchor'] = word_anchor_filter

def display_letters(letters):
    # Return list of letters in display format
    ret = []
    for l in letters:
        if l == u'q':
            l = u'qu'
        ret.append(string.upper(l))
    return ret

def makeResponseObj(letters, solve, user_words):
    if len(letters) > 0:
        game.set(letters)
    else:
        game.shake()
    if solve:
        answers = game.solve()
        answer_score = boggle.score(answers)
        words = cross_out(answers, user_words.split())
        lines_per_col = max(25, (len(answers)+7)/3)
    else:
        answers = None
        answer_score = None
        lines_per_col = None
        words = {}

    return {
        u'rank': boggle.rank,
        u'solve': solve,
        u'letters': string.join(game.letters, u''),
        u'display_letters': display_letters(game.letters),
        u'answers': answers,
        u'answer_score': answer_score,
        u'words': words,
        u'word_score': boggle.score(words),
        u'lines_per_col' : lines_per_col
    }

class MainPageHandler(webapp2.RequestHandler):
    def get(self):
        letters = self.request.get(u'letters')
        solve = self.request.get(u'solve')
        user_words = self.request.get(u'words')

        template_values = makeResponseObj(letters, solve, user_words)
        template = jinja_environment.get_template(u'bawgle-template.html')
        self.response.out.write(template.render(template_values))

class ApiHandler(webapp2.RequestHandler):
    def get(self):
        letters = self.request.get(u'letters')
        solve = self.request.get(u'solve')
        user_words = self.request.get(u'words')

        resp = json.dumps(makeResponseObj(letters, solve, user_words))
        self.response.content_type = 'application/json'
        self.response.out.write(resp)

app = webapp2.WSGIApplication([(u'/', MainPageHandler), (u'/api', ApiHandler)],
                              debug=True)
