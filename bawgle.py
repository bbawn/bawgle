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

dictionary = boggle.Dictionary(u'dict/en_US/en_US_dic_utf-8.txt')
# dictionary = boggle.Dictionary(u'dict/pl_PL/pl_PL_dic_utf-8.txt')
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

def makeResponseObj(letters, user_words):
    if len(letters) > 0:
        game.set(letters)
    else:
        game.shake()

    answers = game.solve()
    answer_score = boggle.score(answers)
    words = cross_out(answers, user_words.split())

    return {
        u'answers': answers,
        u'answer_score': answer_score,
        u'word_score': boggle.score(words),
    }

class ApiHandler(webapp2.RequestHandler):
    def get(self):
        letters = self.request.get(u'letters').split()
        user_words = self.request.get(u'words')

        resp = json.dumps(makeResponseObj(letters, user_words))
        self.response.content_type = 'application/json'
        self.response.out.write(resp)

app = webapp2.WSGIApplication([(u'/api', ApiHandler)], debug=True)
